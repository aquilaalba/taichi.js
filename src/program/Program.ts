import { Runtime } from '../runtime/Runtime';
import { SNodeTree } from '../data/SNodeTree';
import { Scope } from '../language/frontend/Scope';
import { DepthTexture, TextureBase } from '../data/Texture';
import { PrimitiveType } from '../language/frontend/Type';
import { CodegenVisitor } from 'taichi.js/src/language/codegen/WgslCodegen';

export interface ProgramOptions {
    printIR: boolean;
    printWGSL: boolean;
    customWGSL: string | undefined;
}

class Program {

    options: ProgramOptions = {
        printIR: false,
        printWGSL: false,
        customWGSL: ""
    };

    async init(options?: ProgramOptions) {
        if (options && options.printIR !== undefined) {
            this.options.printIR = options.printIR;
        }
        if (options && options.printWGSL !== undefined) {
            this.options.printWGSL = options.printWGSL;
        }
        if (options && options.customWGSL !== undefined) {
            CodegenVisitor.setCustomWgsl(options.customWGSL);
        }
        await this.materializeRuntime();
        this.clearKernelScope();
    }

    runtime: Runtime | null = null;
    partialTree: SNodeTree;
    kernelScope: Scope;

    private static instance: Program;
    private static customWGSL: string | undefined;

    private constructor() {
        this.partialTree = new SNodeTree();
        this.partialTree.treeId = 0;
        this.kernelScope = new Scope();
    }

    public static getCurrentProgram(): Program {
        if (!Program.instance) {
            Program.instance = new Program();
        }
        return Program.instance;
    }

    public static getCustomWGSL(): string | undefined {
        return Program.customWGSL;
    }

    async materializeRuntime() {
        if (!this.runtime) {
            this.runtime = new Runtime();
            await this.runtime.init();
        }
    }

    materializeCurrentTree() {
        if (this.partialTree.size === 0) {
            return;
        }
        if (this.runtime == null) {
            this.materializeRuntime();
        }
        this.runtime!.materializeTree(this.partialTree);
        let nextId = this.partialTree.treeId + 1;
        this.partialTree = new SNodeTree();
        this.partialTree.treeId = nextId;
    }

    addTexture(texture: TextureBase) {
        let id = this.runtime!.textures.length;
        texture.textureId = id;
        this.runtime!.addTexture(texture);
    }

    addToKernelScope(obj: any) {
        for (let name in obj) {
            this.kernelScope.addStored(name, obj[name]);
        }
    }

    clearKernelScope() {
        this.kernelScope = new Scope();
    }
}

export { Program };
