import * as THREE from 'three';
// import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from './jsm';

import WebGL from './webgl';

// -------------- Les variables utiles --------------

var multipleColors = [0x05A8AA, 0xB8D5B8, 0xD7B49E, 0xDC602E, 0xBC412B, 0xF19C79, 0xCBDFBD, 0xF6F4D2, 0xD4E09B, 0xFFA8A9, 0xF786AA, 0xA14A76, 0xBC412B, 0x63A375, 0xD57A66, 0x731A33, 0xCBD2DC, 0xDBD48E, 0x5E5E5E];
var verticePositions = [];

// -------------- Les bases de la scène --------------
// Mise en place de la scene
const scene = new THREE.Scene();
// Création de la caméra : FOV, l'aspect ratio (en général element.width / element.height sinon moche), near et far

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000); // Cube
// const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000); // Ligne

// On bouge un peu la position de la caméra pour voir l'objet
// camera.position.z = 5; // Cube
camera.position.set(0, 0, 100); // Ligne
camera.lookAt(0, 0, 0); // Ligne

// Controle souris
var controls = new OrbitControls(camera, document.querySelector("body"));
controls.autoRotate = true;

// le moteur de rendu
// Pour rendre le canvas transparent : { alpha: true }
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x000000, 1);

// On donne la taille du rendu voulu
renderer.setSize(window.innerWidth, window.innerHeight);
// Puis on l'ajoute dans le html
const rendu = document.body.appendChild(renderer.domElement);


// -------------- Ajout d'une lumière --------------

var light = new THREE.PointLight(0xFFFFFF, 1.5);
/* position the light so it shines on the cube (x, y, z) */
light.position.set(10, 0, 80);
scene.add(light);

// so many lights
var light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 0);
scene.add(light);

var light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(0, -1, 0);
scene.add(light);

var light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 0, 0);
scene.add(light);

var light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(0, 0, 1);
scene.add(light);

var light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, -1);
scene.add(light);

var light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(-1, 0, 0);
scene.add(light);

// -------------- Création d'un cube --------------

// On utilise BoxGeometry pour créer une cube; c'est un objet qui contient des vertices (côtés) et des faces
const geometry = new THREE.BoxGeometry(2, 2, 2);
// On lui attribut un matérial basique grâce à MeshBasicMaterial, et on lui donne une couleur
// Multi color matériel
//const material = new THREE.MeshNormalMaterial();

// Matérial flat color
var color = new THREE.Color("#34ebd8");
var material = new THREE.MeshLambertMaterial({ color: color.getHex() });

// On a besoin d'un mesh, ou l'on va pouvoir y mettre la forme et la matière
const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// update cube vertices
// for (var i = 0, l = geometry.vertices.length; i < l; i++) {
//     // we'll move the x & y position of each vertice by a random amount
//     geometry.vertices[i].x += -10 + Math.random() * 20;
//     geometry.vertices[i].y += -10 + Math.random() * 20;
// }

// -------------- Création d'un icosahedron --------------

var geometryIco = new THREE.IcosahedronGeometry(20);
// Ici, on utilise l'option wireframe pour n'avoir que les côtés
var colorIco = new THREE.Color("#7833aa");
// var materialIco = new THREE.MeshLambertMaterial({ color: colorIco.getHex(), wireframe: true });

// Ici, shiny matière
// var colorIco = new THREE.Color("#eb6234");
// var materialIco = new THREE.MeshPhongMaterial({ color: colorIco.getHex(), specular: 0x009900 });

// Matière perso avec un bump (image noiur et blanc sur laquel on peut appliquer une couleur);
// var textureLoaderIco = new THREE.TextureLoader();
// textureLoaderIco.crossOrigin = true;
// textureLoaderIco.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/53148/4268-bump.jpg', function (texture) {
//     var materialIco = new THREE.MeshPhongMaterial({ color: colorIco.getHex(), bumpMap: texture });
//     meshico = new THREE.Mesh(geometryIco, materialIco);
//     scene.add(meshico);
//     animate();
// });


var materialIco = new THREE.MeshBasicMaterial({ vertexColors: true });
var meshIco = new THREE.Mesh(geometryIco, materialIco);
// changeSkinMeshColor(meshIco);
// scene.add(meshIco);
// console.log(meshIco);
// -------------- Création d'une balle texture personnalisé --------------

var meshBall;
var geometryBall = new THREE.SphereGeometry(24, 32, 32);
// create a loader to get an image from a URL
var textureLoader = new THREE.TextureLoader();
// we've gotta set this to use cross-origin images
textureLoader.crossOrigin = true;
// load in the image
textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/53148/chrispizza.png', function (texture) {
    // this code makes the texture repeat
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    // set the texture as the map for the material
    var materialBall = new THREE.MeshLambertMaterial({ map: texture });
    meshBall = new THREE.Mesh(geometryBall, materialBall);
    scene.add(meshBall);
    // animate();
});

// -------------- Création d'une ligne --------------

const materialLine = new THREE.LineBasicMaterial({ color: 0x0000ff });
const points = [];
points.push(new THREE.Vector3(- 10, 0, 0));
points.push(new THREE.Vector3(0, 10, 0));
points.push(new THREE.Vector3(10, 0, 0));

const geometryLine = new THREE.BufferGeometry().setFromPoints(points);
const line = new THREE.Line(geometryLine, materialLine);
// scene.add(line);

// -------------- Création d'une animation --------------

// fonction qui fait tourner le cube
// Pour faire tourner celui-ci, on appel la fonction requestAnimationFrame qui va rappeler animate a chaque rafraichissement
// A chaque retour dans la fonction, on change les valeurs de positions x et y du cube.
// On appel la fonction render pour afficher le nouveau résultat
function animate() {
    // randomPositionGeometry(meshIco);
    requestAnimationFrame(animate);
    // meshIco.rotation.x += 0.01;
    // meshIco.rotation.y += 0.01;
    renderer.render(scene, camera);
}

generateGalaxy();
// -------------- Vérification d'utilisation de WebGL --------------

// Ici, on vérifié juste l'accès a la librairie WebGL
// Certains navigateurs ne sont pas encore compatibles
if (WebGL.isWebGLAvailable) {
    // Initiate function or other initializations here
    // setInterval(randomPositionGeometry, 3000, meshIco);
    animate();
} else {
    const warning = WebGL.getWebGLErrorMessage;
    document.getElementsByClassName('home-container')[0].appendChild(warning);
}

// function changeSkinMeshColor(skinMesh) {
//     // On prépare nos variables
//     let x;
//     let y;
//     let z;
//     // On active le fait de prendre en compte les couleurs saisies ici et non celle du matériel
//     skinMesh.material.vertexColors = true;
//     // On va chercher la geometry de notre mesh
//     const geometry = skinMesh.geometry;
//     // On compte combien on a de triangles (faces)
//     const count = geometry.attributes.position.count;
//     // Si on a pas d'attribut color, on va devoir la préparer
//     if (!geometry.attributes.color) {
//         // On prépare donc le buffer de la taille du nombre de triangles * 3 (r,g,b)
//         const buffer = new THREE.BufferAttribute(new Float32Array(count * 3), 3)
//         // Puis on l'ajoute a notre geometry
//         geometry.setAttribute('color', buffer);
//     };
//     for (let i = 0; i < count; i++) {
//         // On va chercher des couleurs randoms
//         // Ici, on veut que toute la face de notre forme sois recouverte,
//         // on va donc chercher une nouvelle couleur une fois que les 3 vertices de notre face sois concernées par la couleur
//         if ((i % 3) == 0) {
//             x = Math.random();
//             y = Math.random();
//             z = Math.random();
//         }
//         // On les ajoutes
//         geometry.attributes.color.setXYZ(i, x, y, z);
//         // On on signal une mise à jour a faire pour notre geometry
//         geometry.attributes.color.needsUpdate = true;
//     }
// }

// function copyArray(oldArray, count) {

//     let newArray = [];

//     for (let i = 0; i < count; i++) {
//         if (!newArray.includes(oldArray[i]))
//             newArray[i] = oldArray[i];
//     }
//     return (newArray);
// }

// function randomPositionGeometry(skinMesh) {
//     // On va chercher la geometry de notre mesh
//     const geometry = skinMesh.geometry;
//     // On prépare nos variables
//     let x, y, z, index;
//     x = y = z = index = 0;
//     const count = geometry.attributes.position.count;

//     const positions = geometry.attributes.position.array;
//     let copyPos = copyArray(positions, count);

//     // On compte combien on a de triangles (faces)
//     // const newPos = [];
//     while (!!positions[index]) {

//         if (copyPos.includes(positions[index])) {
//             let oldValue = positions[index];
//             x = (Math.random() - 0.5) * 20 + 1;
//             while (positions.includes(oldValue)) {
//                 // let tweenX = new TWEEN.Tween(oldValue).to(x, 2000);
//                 positions[positions.indexOf(positions.find(element => element == oldValue))] = x;
//             }
//             copyPos.splice(copyPos.indexOf(copyPos.includes(positions[index])), 1);
//         }
//         index++;

//         if (copyPos.includes(positions[index])) {
//             let oldValue = positions[index];
//             y = (Math.random() - 0.5) * 20 + 1;
//             while (positions.includes(oldValue)) {
//                 positions[positions.indexOf(positions.find(element => element == oldValue))] = y;
//             }
//             copyPos.splice(copyPos.indexOf(copyPos.includes(positions[index])), 1);
//         }
//         index++;

//         if (copyPos.includes(positions[index])) {
//             let oldValue = positions[index];
//             z = (Math.random() - 0.5) * 20 + 1;
//             while (positions.includes(oldValue)) {
//                 positions[positions.indexOf(positions.find(element => element == oldValue))] = z;
//             }
//             copyPos.splice(copyPos.indexOf(copyPos.includes(positions[index])), 1);
//         }
//         index++;

//         geometry.computeBoundingBox();
//         geometry.attributes.position.needsUpdate = true;

//     }
// }

// -------------- Galaxy --------------

function generateGalaxy() {
    /**
     * Geometry
     */

    const parameters = {};
    parameters.count = 10000;
    parameters.size = 0.4;

    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(parameters.count * 3);

    for (let i = 0; i < parameters.count; i++) {
        const i3 = i * 3

        positions[i3] = (Math.random() - 0.5) * 3
        positions[i3 + 1] = (Math.random() - 0.5) * 3
        positions[i3 + 2] = (Math.random() - 0.5) * 3
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.scale(100, 100, 100);
    /**
     * Material
     */
    const material = new THREE.PointsMaterial({
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    /**
     * Points
     */
    const points = new THREE.Points(geometry, material)
    scene.add(points);
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

//     function guiChanged() {

//         const uniforms = sky.material.uniforms;
//         uniforms['turbidity'].value = effectController.turbidity;
//         uniforms['rayleigh'].value = effectController.rayleigh;
//         uniforms['mieCoefficient'].value = effectController.mieCoefficient;
//         uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

//         const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
//         const theta = THREE.MathUtils.degToRad(effectController.azimuth);

//         sun.setFromSphericalCoords(1, phi, theta);

//         uniforms['sunPosition'].value.copy(sun);
//         renderer.toneMappingExposure = effectController.exposure;
//         renderer.render(scene, camera);

//     }

//     const gui = new GUI();

//     gui.add(effectController, 'turbidity', 0.0, 20.0, 0.1).onChange(guiChanged);
//     gui.add(effectController, 'rayleigh', 0.0, 4, 0.001).onChange(guiChanged);
//     gui.add(effectController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(guiChanged);
//     gui.add(effectController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(guiChanged);
//     gui.add(effectController, 'elevation', 0, 90, 0.1).onChange(guiChanged);
//     gui.add(effectController, 'azimuth', - 180, 180, 0.1).onChange(guiChanged);
//     gui.add(effectController, 'exposure', 0, 1, 0.0001).onChange(guiChanged);

//     guiChanged();

// }