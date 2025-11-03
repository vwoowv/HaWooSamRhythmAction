export abstract class Singleton {
    private static _instances: WeakMap<Function, any> = new WeakMap();

    protected constructor() {}

    public static get I(): any {
        let instance = Singleton._instances.get(this);
        if (!instance) {
            const Ctor = this as unknown as { new (): any };
            instance = new Ctor();
            Singleton._instances.set(this, instance);
        }
        return instance;
    }
}


