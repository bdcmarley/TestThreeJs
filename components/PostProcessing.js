import * as THREE from 'three';

// import { GUI } from "dat.gui";

import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const wh = window.innerHeight;
const ww = window.innerWidth;

class PostProcessing {

    scene; renderer; camera; renderScene; bloomLayer; darkMaterial; materials; outputPass;

    constructor(scene, renderer, camera) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;

        this.renderScene = new RenderPass(this.scene, this.camera);
        this.outputPass = new OutputPass();
    }

    bloomEffect() {
        const params = {
            threshold: 0,
            strength: 1,
            radius: 1,
            exposure: 1
        };

        this.darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' })
        this.materials = {};

        this.bloomLayer = new THREE.Layers();
        this.bloomLayer.set(1);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = params.threshold;
        bloomPass.strength = params.strength;
        bloomPass.radius = params.radius;

        this.bloomComposer = new EffectComposer(this.renderer);
        this.bloomComposer.renderToScreen = false;
        this.bloomComposer.setSize(window.innerWidth, window.innerHeight);
        this.bloomComposer.addPass(this.renderScene);
        this.bloomComposer.addPass(bloomPass);

        const mixPass = new ShaderPass(
            new THREE.ShaderMaterial({
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
                },
                vertexShader: document.getElementById('vertexshader').textContent,
                fragmentShader: document.getElementById('fragmentshader').textContent,
                defines: {}
            }), 'baseTexture'
        );
        mixPass.needsSwap = true;
        return (mixPass);
    }

    static ssrEffect(scene, renderer, camera) {
        // const renderer = this.renderer;
        // const scene = this.scene;
        // const camera = this.camera;

        const ssrPass = new SSRPass({
            renderer,
            scene,
            camera,
            width: innerWidth,
            height: innerHeight,
            thickness: 0.018,
        });

        ssrPass.maxDistance = 50;
        ssrPass.blur = false;
        ssrPass.opacity = 0.5;
        ssrPass.infiniteThick = false;
        return (ssrPass);
    }
}
export default PostProcessing;

