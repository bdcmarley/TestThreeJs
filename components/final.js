import * as THREE from 'three';
import WebGL from './webgl';

import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

import Lights from './lights';
import PostProcessing from './PostProcessing';

import Stats from 'three/examples/jsm/libs/stats.module';
import { GUI } from "dat.gui";

const wh = window.innerHeight;
const ww = window.innerWidth;
const STEPS_PER_FRAME = 5;

const clock = new THREE.Clock();
const scene = new THREE.Scene();
THREE.ColorManagement.enabled = true;

const stats = new Stats();

// ------------- Création du render et mise en place du post-processing -------------

// Ici, le renderer de base
const renderer = new THREE.WebGLRenderer({
    depth: false,
    powerPreference: 'high-performance',
    logarithmicDepthBuffer: false,
    physicallyCorrectLights: true,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true,
    precision: "highp",
    gammaOutput: true,
    gammaFactor: 2.2,
    antialias: true,
    alpha: true
});

let ssrComposer, sky, water, sun, composer, glbScene, mixer;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(250, 1, 0); // Ligne

function setRenderer() {
    // renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setPixelRatio(window.devicePixelRatio * 0.5);

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.gammaOutput = true;
    renderer.gammaInput = true;

    renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.VSMShadowMap;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 0;
    renderer.autoClear = false;
    // renderer.setClearColor(0x000000, 1);
    document.body.appendChild(renderer.domElement);
}

function addDebug() {
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.dom);
}

function postProcessing() {
    composer = new EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);

    //     ssrComposer = PostProcessing.ssrEffect(composer, scene, renderer, camera);
    //     composer.addPass(ssrComposer);
}

function loaderGlbScene() {
    const loader = new GLTFLoader().setPath('/build/3d/')
    loader.load('water9.glb', function (glb) {

        glbScene = glb.scene;  // glbScene 3D object is loaded
        glbScene.scale.set(1.1, 1.1, 1.1);

        mixer = new THREE.AnimationMixer(glbScene);
        mixer.clipAction(glb.animations[0]).play();

        glbScene.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.frustumCulled = false;

                if (child.material.map) {
                    child.material.map.anisotropy = 16;
                }
                scene.add(child);
            }
        });
    });
}

const skyEffectController = {
    turbidity: 0,
    rayleigh: 4,
    mieDirectionalG: 0.95,
    elevation: 0,
    azimuth: 0,
    mieCoefficient: 0.1,
    exposure: 0
};

function initSky() {
    // Add Sky
    sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    sun = new THREE.Vector3();

    function guiChanged() {

        const uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = skyEffectController.turbidity;
        uniforms['rayleigh'].value = skyEffectController.rayleigh;
        uniforms['mieCoefficient'].value = skyEffectController.mieCoefficient;
        uniforms['mieDirectionalG'].value = skyEffectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad(90 - skyEffectController.elevation);
        const theta = THREE.MathUtils.degToRad(skyEffectController.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        uniforms['sunPosition'].value.copy(sun);
        renderer.toneMappingExposure = skyEffectController.exposure;
        renderer.render(scene, camera);

    }

    const gui = new GUI();

    gui.add(skyEffectController, 'turbidity', 0.0, 20.0, 0.1).onChange(guiChanged);
    gui.add(skyEffectController, 'rayleigh', 0.0, 4, 0.001).onChange(guiChanged);
    gui.add(skyEffectController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(guiChanged);
    gui.add(skyEffectController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(guiChanged);
    gui.add(skyEffectController, 'elevation', 0, 90, 0.1).onChange(guiChanged);
    gui.add(skyEffectController, 'azimuth', - 180, 180, 0.1).onChange(guiChanged);
    gui.add(skyEffectController, 'exposure', 0, 1, 0.0001).onChange(guiChanged);

    guiChanged();
}

function initWater() {
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);

    water = new Water(
        waterGeometry,
        {
            textureWidth: 4096,
            textureHeight: 4096,
            waterNormals: new THREE.TextureLoader().load('/build/img/waternormals.537ec85b.jpg', function (texture) {

                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            }),
            sunDirection: new THREE.Vector3(),
            sunColor: "#ffffff",
            waterColor: 0x001e0f,
            distortionScale: 8,
            flowDirection: new THREE.Vector2(1, 0),
        }
    );

    water.rotation.x = - Math.PI / 2;

    const uniforms = water.material.uniforms;
    uniforms['size'].value = 500;
    console.log(uniforms);

    scene.add(water);
}

let tmp1 = 0, tmp2 = 0;
function dayAndNight() {
    const MAX_ELEVATION = 90, MAX_TURBIDITY = 15, MAX_MIEDIRECTIONALG = 0.05, MAX_AZIMUTH = 180, CONV_FACTOR = 0.001;

    if (skyEffectController.azimuth == 0 && skyEffectController.mieDirectionalG == 0.95 && tmp2 <= 0 && skyEffectController.elevation < MAX_ELEVATION) {
        tmp1 += CONV_FACTOR;

        skyEffectController.turbidity = tmp1 * 20;
        skyEffectController.elevation = tmp1 * MAX_ELEVATION;
    } else if (skyEffectController.elevation >= 1 && skyEffectController.mieDirectionalG == 0.95) {
        tmp1 -= CONV_FACTOR;
        skyEffectController.azimuth = 180;

        skyEffectController.elevation = tmp1 * MAX_ELEVATION;
        skyEffectController.turbidity = tmp1 * MAX_TURBIDITY;

        skyEffectController.mieDirectionalG = 0.95;
    } else if (skyEffectController.azimuth == 180 && skyEffectController.mieDirectionalG < 1) {
        tmp1 += CONV_FACTOR;

        skyEffectController.turbidity = tmp1 * 20;
        skyEffectController.mieDirectionalG = 0.95 + (tmp1 * MAX_MIEDIRECTIONALG);

        tmp2 = tmp1;
        skyEffectController.elevation = 0;
    } else if (skyEffectController.azimuth > 1 && skyEffectController.mieDirectionalG >= 1 && skyEffectController.turbidity >= 20) {
        tmp1 -= CONV_FACTOR;

        skyEffectController.azimuth = tmp1 * MAX_AZIMUTH;

        skyEffectController.turbidity = 20;
        skyEffectController.mieDirectionalG = 1;
    } else if (skyEffectController.azimuth <= 1 && tmp2 > 0) {
        tmp2 -= CONV_FACTOR;

        skyEffectController.turbidity = tmp2 * 20;
        skyEffectController.mieDirectionalG = 0.95;
        skyEffectController.azimuth = 0;
    }

    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = skyEffectController.turbidity;
    uniforms['rayleigh'].value = skyEffectController.rayleigh;
    uniforms['mieCoefficient'].value = skyEffectController.mieCoefficient;
    uniforms['mieDirectionalG'].value = skyEffectController.mieDirectionalG;
    const phi = THREE.MathUtils.degToRad(90 - skyEffectController.elevation);
    const theta = THREE.MathUtils.degToRad(skyEffectController.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sun);
}

function init() {
    addDebug();
    // addLight();
    initSky();
    // loaderGlbScene();
    setRenderer();
    initWater();
    postProcessing();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    ssrComposer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);

    composer.render();
}

function animate() {
    const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

    // if (!!mixer) {
    //     mixer.update(deltaTime);
    // }
    water.material.uniforms['time'].value += 1.0 / 60.0;
    dayAndNight();

    renderer.clear();
    // composer.render();
    renderer.render(scene, camera);

    stats.update();
    requestAnimationFrame(animate);
}

if (WebGL.isWebGLAvailable) {
    // Initiate function or other initializations here
    window.addEventListener('resize', onWindowResize, false);
    init();
    animate();
} else {
    const warning = WebGL.getWebGLErrorMessage;
    document.getElementsByClassName('home-container')[0].appendChild(warning);
}