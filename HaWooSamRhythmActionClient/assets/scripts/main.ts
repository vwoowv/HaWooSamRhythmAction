import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    constructor() {
        super();
    }

    start() {
        console.log("Main start");
    }

    update(deltaTime: number) {
    }
}