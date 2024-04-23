import * as THREE from 'three';
import WebGL from './webgl';
import Stats from 'three/examples/jsm/libs/stats.module';

import { Sky } from 'three/addons/objects/Sky.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';

import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

import * as POSTPROCESSING from "postprocessing";


import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
// import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
// import { Reflector } from 'three/examples/jsm/objects/Reflector'

// import { SSRDebugGUI } from "./SSRDebugGUI";
import { defaultSSROptions, SSREffect } from "screen-space-reflections";


import { GUI } from "dat.gui";

import Lights from './lights';
import PostProcessing from './PostProcessing';

let arrow, lastInteraction, playerOnFloor = false, mouseTime = 0, modelReady, glbScene, sky, sun, width, height;

const wh = window.innerHeight;
const ww = window.innerWidth;

// let mixer;
// const animationActions = [];
// let activeAction = THREE.AnimationAction;
// let lastAction = THREE.AnimationAction;

const clock = new THREE.Clock();
const scene = new THREE.Scene();
THREE.ColorManagement.enabled = true;

// DEBUG AND DEV
// import { OrbitControls } from './jsm';
// const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000); // Cube
// camera.position.set(0, 0, 100); // Ligne
// camera.lookAt(0, 0, 0); // Ligne
// var controls = new OrbitControls(camera, document.querySelector("body"));
// DEBUG AND DEV

// ------------- Création du render et mise en place du post-processing -------------

// Ici, le renderer de base
const renderer = new THREE.WebGLRenderer({
    // depth: false,
    powerPreference: 'high-performance',
    logarithmicDepthBuffer: false,
    physicallyCorrectLights: true,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true,
    precision: "highp",
    gammaOutput: true,
    gammaFactor: 2.2,
    alpha: true
});

// La, les variables qui accueillerons les Class du post-processing
let bloomComposer, composer, ssrComposer, fxaaComposer, finalComposer;

// Préparation du layer (filtre) pour l'effet bloom.
const bloomLayer = new THREE.Layers();
bloomLayer.set(1);

// Préparation du matériel noir ainsi que du tablea pour mettre les objets ou l'on ne doit pas apppliquer l'effet bloom.
const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const materials = {};

// On y ajoute la visualisation des performances (dev)
const stats = new Stats();

// ------------- Création des variables permettant de gérer la physique, les déplacements et les intéractions -------------

// Dans keyStates, nous mettrons à jour les event key, pour permettre au code d'activer les comportements.
const keyStates = {};

// Classe qui accueillera le monde, pour établir les collisions.
const worldOctree = new Octree();
const GRAVITY = 50, STEPS_PER_FRAME = 5;

// Tableau qui contiendra les objets avec lesquelles le joueur peut intéragir
const interactions = [];

// Mise en place de la camera, en perspective. La caméra sera la vision de l'utilisateur.
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.rotation.order = 'YXZ';

// Le raycaster sert a déterminer le centre de l'écran, pour savoir ce que regarde l'utilisateur et ainsi déterminer si une intéraction est faisable.
const raycaster = new THREE.Raycaster(camera.getWorldPosition(new THREE.Vector3()), camera.getWorldDirection(new THREE.Vector3()));

// Dimension de l'utilisateur
const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);
// Vitesse de l'utilisateur
const playerVelocity = new THREE.Vector3(), playerDirection = new THREE.Vector3();

// -------------- Déplacement --------------

document.addEventListener('keydown', (event) => {
    keyStates[event.code] = true;
});
document.addEventListener('keyup', (event) => {
    keyStates[event.code] = false;
});
document.addEventListener('mousedown', () => {
    if (document.pointerLockElement !== null) {
        let intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0) {
            let intersect = intersects[0];

            if (!!interactions[intersect.object.name]) {
                let interaction = document.querySelector('.' + intersect.object.name);

                if (interactions[intersect.object.name] == 1) {
                    interaction.style.display = '-webkit-box';
                    interactions[intersect.object.name] = 2;
                    lastInteraction = intersect.object.name;
                } else {
                    interaction.style.display = 'none';
                    interactions[intersect.object.name] = 1;
                    lastInteraction = intersect.object.name;
                }
            } else if (interactions[lastInteraction] == 2) {
                let interaction = document.querySelector('.' + lastInteraction);
                interaction.style.display = 'none';
                interactions[lastInteraction] = 1;
            }
        }
    }

    document.body.requestPointerLock();
    mouseTime = performance.now();
});

document.body.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= event.movementX / 500;
        camera.rotation.x -= event.movementY / 500;
    }
});

function playerCollisions() {

    const result = worldOctree.capsuleIntersect(playerCollider);

    playerOnFloor = false;

    if (result) {
        playerOnFloor = result.normal.y > -15;
        if (!playerOnFloor) {
            playerVelocity.addScaledVector(result.normal, - result.normal.dot(playerVelocity));
        }
        playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }
}

function updatePlayer(deltaTime) {

    let damping = Math.exp(- 4 * deltaTime) - 1;

    if (!playerOnFloor) {
        playerVelocity.y -= GRAVITY * deltaTime;
        // small air resistance
        damping *= 0.1;
    }

    playerVelocity.addScaledVector(playerVelocity, damping);
    const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
    playerCollider.translate(deltaPosition);
    playerCollisions();
    camera.position.copy(playerCollider.end);
}

function getForwardVector() {
    camera.getWorldDirection(playerDirection);
    playerDirection.y = 0;
    playerDirection.normalize();
    return (playerDirection);
}

function getSideVector() {
    camera.getWorldDirection(playerDirection);
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross(camera.up);
    return (playerDirection);
}

function controls(deltaTime) {
    // gives a bit of air control
    const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);

    if (keyStates['KeyW'] || keyStates['ArrowUp']) {
        playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
    }
    if (keyStates['KeyS'] || keyStates['ArrowDown']) {
        playerVelocity.add(getForwardVector().multiplyScalar(- speedDelta));
    }
    if (keyStates['KeyA'] || keyStates['ArrowLeft']) {
        playerVelocity.add(getSideVector().multiplyScalar(- speedDelta));
    }
    if (keyStates['KeyD'] || keyStates['ArrowRight']) {
        playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
    }
    if (playerOnFloor) {
        if (keyStates['Space']) {
            playerVelocity.y = 15;
        }
    }
}

function teleportPlayerIfOob() {
    if (camera.position.y <= - 25) {
        playerCollider.start.set(0, 50.35, 0);
        playerCollider.end.set(0, 50, 0);
        playerCollider.radius = 0.35;
        camera.position.copy(playerCollider.end);
        camera.rotation.set(0, 90, 0);
    }
}

// -------------- Construction de la scène --------------

function sceneParameters() {
    // scene.background = new THREE.Color(0xFFC0CB);
    // scene.fog = new THREE.Fog(0xC0C0C0, 0, 50);
}

function addLight() {
    var light = new THREE.PointLight(0xFFFFFF, 1.5);
    /* position the light so it shines on the cube (x, y, z) */
    light.position.set(20, 50, -50);
    light.castShadow = true;

    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    // scene.add(directionalLight);
    // const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
    // scene.add(helper);
    // const helper2 = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(helper2);

    directionalLight.shadow.mapSize.width = 1024 * 4;
    directionalLight.shadow.mapSize.height = 1024 * 4;

    // const effectController = {
    //     positionX: 27,
    //     positionY: 200,
    //     positionZ: -128,
    //     rotationX: -7.2,
    //     rotationY: 0,
    //     rotationZ: 0,
    //     targetX: 50,
    //     targetY: -87.4,
    //     targetZ: 50,
    //     intensity: 0.1,
    // };

    const effectController = {
        positionX: 10,
        positionY: 100,
        positionZ: -506,

        rotationX: -7.2,
        rotationY: 0,
        rotationZ: 0,

        targetX: 0,
        targetY: 0,
        targetZ: 0,

        left: 0,
        right: 0,
        top: 0,
        bottom: 0,

        intensity: 1,
        near: 0,
        far: 0
    };

    function guiChanged() {
        directionalLight.position.x = effectController.positionX;
        directionalLight.position.y = effectController.positionY;
        directionalLight.position.z = effectController.positionZ;

        directionalLight.rotation.x = effectController.rotationX;
        directionalLight.rotation.y = effectController.rotationY;
        directionalLight.rotation.z = effectController.rotationZ;

        directionalLight.target.position.x = effectController.targetX;
        directionalLight.target.position.y = effectController.targetY;
        directionalLight.target.position.z = effectController.targetZ;

        directionalLight.shadow.camera.left = effectController.left;
        directionalLight.shadow.camera.right = effectController.right;
        directionalLight.shadow.camera.top = effectController.top;
        directionalLight.shadow.camera.bottom = effectController.bottom;

        directionalLight.intensity = effectController.intensity;
        directionalLight.shadow.camera.far = effectController.far;
        directionalLight.shadow.camera.near = effectController.near;

        directionalLight.target.updateMatrixWorld();
        directionalLight.shadow.camera.updateMatrixWorld();
    }

    // const gui = new GUI();
    // const DirectionalLightFolder = gui.addFolder('DirectionalLight');

    // DirectionalLightFolder.add(effectController, 'positionX', -2000, 2000, 2).onChange(guiChanged);
    // DirectionalLightFolder.add(effectController, 'positionY', -2000, 2000, 2).onChange(guiChanged);
    // DirectionalLightFolder.add(effectController, 'positionZ', -2000, 2000, 2).onChange(guiChanged);

    // DirectionalLightFolder.add(effectController, 'rotationX', -100, 100, 0.1).onChange(guiChanged);
    // DirectionalLightFolder.add(effectController, 'rotationY', -100, 100, 0.1).onChange(guiChanged);
    // DirectionalLightFolder.add(effectController, 'rotationZ', -100, 100, 0.1).onChange(guiChanged);

    // DirectionalLightFolder.add(effectController, 'targetX', -100, 100, 0.1).onChange(guiChanged);
    // DirectionalLightFolder.add(effectController, 'targetY', -100, 100, 0.1).onChange(guiChanged);
    // DirectionalLightFolder.add(effectController, 'targetZ', -100, 100, 0.1).onChange(guiChanged);

    // DirectionalLightFolder.add(effectController, 'left', -100, 100, 0.1).onChange(guiChanged);
    // DirectionalLightFolder.add(effectController, 'right', -100, 100, 0.1).onChange(guiChanged);
    // DirectionalLightFolder.add(effectController, 'top', -100, 100, 0.1).onChange(guiChanged);
    // DirectionalLightFolder.add(effectController, 'bottom', -100, 100, 0.1).onChange(guiChanged);

    // DirectionalLightFolder.add(effectController, 'intensity', 0, 1, 0.01);
    // DirectionalLightFolder.add(effectController, 'far', 0, 1, 0.01);
    // DirectionalLightFolder.add(effectController, 'near', 0, 1, 0.01);



    // DirectionalLightFolder.add(effectController, 'radius', -50, 50, 0.1).onChange(guiChanged);
    // DirectionalLightFolder.open();

    // guiChanged();
    // scene.add(spotLight1.target);
    scene.add(Lights.entryLight());
    scene.add(Lights.sunLight());


    // Lights.testLight(scene);
}

function setRenderer() {
    // renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.gammaOutput = true;
    renderer.gammaInput = true;

    renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0.0);
    document.body.appendChild(renderer.domElement);
}

function postProcessing() {
    composer = new EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);

    const renderScene = new RenderPass(scene, camera);
    composer.addPass(renderScene);

    ssrComposer = PostProcessing.ssrEffect(scene, renderer, camera);
    composer.addPass(ssrComposer);

    // Ajoute l'effet bloom
    // bloomComposer = PostProcessing.bloomEffect(composer, renderScene, renderer);
    // bloomComposer = PostProcessing.bloomEffect(composer, renderer, scene, camera);
    // composer.addPass(bloomComposer);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // composer.addPass(new ShaderPass(GammaCorrectionShader));


}

function addDebug() {
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.dom);

    const helper = new OctreeHelper(worldOctree);
    helper.visible = true;
    scene.add(helper);

    scene.add(new THREE.AxesHelper(5));
}

function loaderGlbScene() {
    const loader = new GLTFLoader().setPath('/build/3d/')
    loader.load('water9.glb', function (glb) {

        glbScene = glb.scene;  // glbScene 3D object is loaded
        // glbScene.scale.set(0.08, 0.08, 0.08);
        glbScene.scale.set(1.1, 1.1, 1.1);
        // glbScene.position.set(10, 10, 10);

        // mixer = new THREE.AnimationMixer(glbScene);
        // mixer.clipAction(glb.animations[0]).play();

        glbScene.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.frustumCulled = false;

                if (child.material.map) {
                    child.material.map.anisotropy = 16;
                }

                // child.material.color.setScalar(0.05)
                // child.material.roughness = 0.2
                // child.material.envMapIntensity = Math.PI;
                // child.updateMatrixWorld();

                worldOctree.fromGraphNode(child);
                child.removeFromParent();
                child.geometry.dispose();
                child.material.dispose();
                scene.add(child);
            }
        });

    });
}

function addCube() {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    var color = new THREE.Color("#34ebd8");
    var material = new THREE.MeshLambertMaterial({ color: color.getHex() });
    const cube = new THREE.Mesh(geometry, material);
    const name = "letter";
    cube.name = name;
    scene.add(cube);
    interactions[name] = 1;
    worldOctree.fromGraphNode(cube);
}

// function initSky() {

//     // Add Sky
//     sky = new Sky();
//     sky.scale.setScalar(450000);
//     scene.add(sky);

//     sun = new THREE.Vector3();

//     /// GUI
//     const effectController = {
//         turbidity: 10,
//         rayleigh: 3,
//         mieCoefficient: 0.005,
//         mieDirectionalG: 0.7,
//         elevation: 2,
//         azimuth: 180,
//         exposure: renderer.toneMappingExposure
//     };


//     const uniforms = sky.material.uniforms;
//     uniforms['turbidity'].value = effectController.turbidity;
//     uniforms['rayleigh'].value = effectController.rayleigh;
//     uniforms['mieCoefficient'].value = effectController.mieCoefficient;
//     uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

//     const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
//     const theta = THREE.MathUtils.degToRad(effectController.azimuth);

//     sun.setFromSphericalCoords(1, phi, theta);

//     uniforms['sunPosition'].value.copy(sun);
// }

// function openDoor() {
//     if (mixer) {
//         mixer.clipAction(glb.animations[0]).play();
//         var delta = clock.getDelta();
//         mixer.update(delta);
//     }
// }

// -------------- Fonction d'initialisation --------------

function init() {
    console.log("yooooo");
    sceneParameters();
    initSky();
    addLight();
    setRenderer();
    loaderGlbScene();
    // addCube();
    postProcessing();
    addDebug();
}

function initSky() {

    // Add Sky
    sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    sun = new THREE.Vector3();

    /// GUI

    const effectController = {
        turbidity: 0,
        rayleigh: 4,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        elevation: 90,
        azimuth: 180,
        exposure: renderer.toneMappingExposure
    };

    function guiChanged() {

        const uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = effectController.turbidity;
        uniforms['rayleigh'].value = effectController.rayleigh;
        uniforms['mieCoefficient'].value = effectController.mieCoefficient;
        uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
        const theta = THREE.MathUtils.degToRad(effectController.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        uniforms['sunPosition'].value.copy(sun);

        renderer.toneMappingExposure = effectController.exposure;
        renderer.render(scene, camera);

    }

    const gui = new GUI();

    gui.add(effectController, 'turbidity', -100, 100, 1).onChange(guiChanged);
    gui.add(effectController, 'rayleigh', -100, 100, 1).onChange(guiChanged);
    gui.add(effectController, 'mieCoefficient', -100, 100, 1).onChange(guiChanged);
    gui.add(effectController, 'mieDirectionalG', -100, 100, 1).onChange(guiChanged);
    gui.add(effectController, 'elevation', -500, 500, 1).onChange(guiChanged);
    gui.add(effectController, 'azimuth', -500, 500, 1).onChange(guiChanged);
    gui.add(effectController, 'exposure', -100, 100, 1).onChange(guiChanged);

    guiChanged();

}

// -------------- Maitriser le resize de la fenêtre --------------

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
    ssrComposer.setSize(window.innerWidth, window.innerHeight);
    // fxaaComposer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);

    composer.render()
}

// -------------- Création d'une animation --------------

// fonction d'animation
// Pour se faire, on appel la fonction requestAnimationFrame qui va rappeler animate a chaque rafraichissement
// On appel la fonction render pour afficher le nouveau résultat

function animate() {
    const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

    // if (!!mixer) {
    //     mixer.update(deltaTime);
    // }

    for (let i = 0; i < STEPS_PER_FRAME; i++) {
        controls(deltaTime);
        updatePlayer(deltaTime);
        teleportPlayerIfOob();
    }

    raycaster.set(camera.getWorldPosition(new THREE.Vector3()), camera.getWorldDirection(new THREE.Vector3()));
    scene.remove(arrow);
    arrow = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 5, 0x000000);
    scene.add(arrow);

    if (!!bloomComposer && !!composer) {
        renderer.clear();
        scene.traverse(nonBloomed);
        bloomComposer.render();
        scene.traverse(restoreMaterial);
        composer.render();
        // ssrComposer.render();
    } else if (!!composer) {
        renderer.clear();
        composer.render();
    }

    stats.update();
    requestAnimationFrame(animate);
}

// -------------- Vérification d'utilisation de WebGL --------------

// Ici, on vérifié juste l'accès a la librairie WebGL
// Certains navigateurs ne sont pas encore compatibles
if (WebGL.isWebGLAvailable) {
    // Initiate function or other initializations here
    window.addEventListener('resize', onWindowResize, false);
    init();
    animate();
} else {
    const warning = WebGL.getWebGLErrorMessage;
    document.getElementsByClassName('home-container')[0].appendChild(warning);
}

function nonBloomed(obj) {
    if (obj.isMesh && (obj.material.name != "Material.005") || obj.type == "DirectionalLight" || obj.type == "Line" || obj.type == "PointLight" || obj.type == "Scene" || obj.type == "OctreeHelper" || obj.type == "SpotLight" || obj.type == "ArrowHelper") {
        materials[obj.uuid] = obj.material;
        obj.material = darkMaterial;
    }
}

// function nonReflect(obj) {
//     if (obj.isMesh && obj.material.name != "Material.001") {
//         materials[obj.uuid] = obj.material;
//         obj.material = darkMaterial;
//     }
// }

function restoreMaterial(obj) {
    if (materials[obj.uuid]) {
        obj.material = materials[obj.uuid];
        delete materials[obj.uuid];
    }
}

// -------------- Instructions --------------

// var instructions = document.querySelector("#instructions");
// var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
// if (havePointerLock) {
//     var element = document.body;
//     var pointerlockchange = function (event) {
//         if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
//             controls.enabled = true;
//             instructions.style.display = 'none';
//         } else {
//             controls.enabled = false;
//             instructions.style.display = '-webkit-box';
//         }
//     };
//     var pointerlockerror = function (event) {
//         instructions.style.display = 'none';
//     };

//     document.addEventListener('pointerlockchange', pointerlockchange, false);
//     document.addEventListener('mozpointerlockchange', pointerlockchange, false);
//     document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
//     document.addEventListener('pointerlockerror', pointerlockerror, false);
//     document.addEventListener('mozpointerlockerror', pointerlockerror, false);
//     document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

//     instructions.addEventListener('click', function (event) {
//         element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
//         if (/Firefox/i.test(navigator.userAgent)) {
//             var fullscreenchange = function (event) {
//                 if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
//                     document.removeEventListener('fullscreenchange', fullscreenchange);
//                     document.removeEventListener('mozfullscreenchange', fullscreenchange);
//                     element.requestPointerLock();
//                 }
//             };
//             document.addEventListener('fullscreenchange', fullscreenchange, false);
//             document.addEventListener('mozfullscreenchange', fullscreenchange, false);
//             element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
//             element.requestFullscreen();
//         } else {
//             element.requestPointerLock();
//         }
//     }, false);
// } else {
//     instructions.innerHTML = 'Your browser not suported PointerLock';
// }
