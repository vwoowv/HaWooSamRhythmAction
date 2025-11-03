import { AudioClip, Component, instantiate, Prefab, Node, resources, SpriteFrame } from "cc";
import { Singleton } from "../base/singleton";

export interface IAssetLists {
    prefabs?: string[];
    audioClips?: string[];
    spriteFrames?: string[];
}

export class ResourceManager extends Singleton {
    private constructor() { super(); }
    private resourceCache: Map<string, any> = new Map();

    public loadResource<T>(path: string, type: any): Promise<T> {
        if (this.resourceCache.has(path)) {
            return Promise.resolve(this.resourceCache.get(path) as T);
        }

        return new Promise((resolve, reject) => {
            resources.load(path, type, (err, asset) => {
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

    public async preloadGameAssets(assetLists: IAssetLists, onProgress?: (progress: number) => void) {
        const assetGroups = [];
        if (assetLists.prefabs?.length > 0) {
            assetGroups.push({ paths: assetLists.prefabs, type: Prefab });
        }
        if (assetLists.audioClips?.length > 0) {
            assetGroups.push({ paths: assetLists.audioClips, type: AudioClip });
        }
        if (assetLists.spriteFrames?.length > 0) {
            assetGroups.push({ paths: assetLists.spriteFrames, type: SpriteFrame });
        }

        let totalAssets = 0;
        assetGroups.forEach(group => totalAssets += group.paths.length);
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

    public async spawnPrefab<T extends Component>(path: string, parent: Node): Promise<T> {
        const prefab = await this.loadResource<Prefab>(path, Prefab);
        const newNode: Node = instantiate(prefab);
        parent.addChild(newNode);
        return newNode.getComponent(Component) as T;
    }
}
