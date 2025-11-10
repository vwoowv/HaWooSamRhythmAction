import { AudioClip, Component, instantiate, Prefab, Node, resources, SpriteFrame } from "cc";
import { Singleton } from "../base/singleton";

export interface IAssetLists {
    prefabs?: string[];
    audioClips?: string[];
    spriteFrames?: string[];
}

type Ctor<T> = { new(...args: any[]): T };

export class ResourceManager extends Singleton {
    public static override get I(): ResourceManager { return super.I as ResourceManager; }

    private constructor() { super(); }

    private resourceCache: Map<string, unknown> = new Map();

    public loadResource<T>(path: string, type: Ctor<T>): Promise<T> {
        if (this.resourceCache.has(path)) {
            return Promise.resolve(this.resourceCache.get(path) as T);
        }

        return new Promise((resolve, reject) => {
            resources.load(path, type as any, (err, asset) => {
                if (err) {
                    console.error(`리소스 로드 실패: ${path}`, err);
                    reject(err);
                    return;
                }
                this.resourceCache.set(path, asset);
                resolve(asset as T);
            });
        });
    }

    public getFromCache<T>(path: string): T | undefined {
        return this.resourceCache.get(path) as T | undefined;
    }

    public async preloadGameAssets(assetLists: IAssetLists, onProgress?: (progress: number) => void) {
        const assetGroups: Array<{ paths: string[]; type: Ctor<any> }> = [];
        if (assetLists.prefabs?.length) {
            assetGroups.push({ paths: assetLists.prefabs, type: Prefab });
        }
        if (assetLists.audioClips?.length) {
            assetGroups.push({ paths: assetLists.audioClips, type: AudioClip });
        }
        if (assetLists.spriteFrames?.length) {
            assetGroups.push({ paths: assetLists.spriteFrames, type: SpriteFrame });
        }

        const totalAssets = assetGroups.reduce((sum, g) => sum + g.paths.length, 0);
        if (totalAssets === 0) {
            onProgress?.(1);
            return;
        }

        let loadedAssets = 0;
        for (const group of assetGroups) {
            for (const path of group.paths) {
                if (!this.resourceCache.has(path)) {
                    await this.loadResource(path, group.type);
                }
                loadedAssets++;
                onProgress?.(loadedAssets / totalAssets);
            }
        }
    }

    public async spawnPrefab(path: string, parent: Node): Promise<Node>;
    public async spawnPrefab<T extends Component>(path: string, compCtor: Ctor<T>, parent: Node): Promise<T>;
    public async spawnPrefab<T extends Component>(path: string, arg2: Node | Ctor<T>, arg3?: Node): Promise<Node | T> {
        const parent = (arg3 ? arg3 : arg2) as Node;
        const prefab = await this.loadResource<Prefab>(path, Prefab);
        const newNode: Node = instantiate(prefab);
        parent.addChild(newNode);
        if (arg3) {
            const compCtor = arg2 as Ctor<T>;
            return newNode.getComponent(compCtor) as T;
        }
        return newNode;
    }

    public release(path: string): boolean {
        if (!this.resourceCache.has(path)) return false;
        const asset = this.resourceCache.get(path) as any;
        try {
            resources.release(asset);
        } finally {
            this.resourceCache.delete(path);
        }
        return true;
    }

    public clear(): void {
        for (const asset of this.resourceCache.values()) {
            resources.release(asset as any);
        }
        this.resourceCache.clear();
    }
}
