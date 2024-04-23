import * as THREE from 'three';
import { OrbitControls } from './jsm';
import WebGL from './webgl';
import Stats from 'three/examples/jsm/libs/stats.module';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import $ from 'jquery';



$(window).on('load', function () {

    const boxView = document.querySelector(".configurator-view");

    // Initialisation de la scène 3D
    const scene = new THREE.Scene();

    // Indique les axes X,Y,Z
    scene.add(new THREE.AxesHelper(5));

    const camera = new THREE.PerspectiveCamera(75, boxView.clientWidth / boxView.clientHeight, 0.1, 1000); // Cube
    // camera.position.set(0, 0, 100); // Ligne
    // camera.lookAt(0, 0, 0); // Ligne
    camera.position.z = 3

    // le moteur de rendu
    // Pour rendre le canvas transparent : { alpha: true }
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    // On donne la taille du rendu voulu
    renderer.setSize(boxView.clientWidth, boxView.clientHeight);
    // Puis on l'ajoute dans le html
    boxView.appendChild(renderer.domElement);

    // Controle souris
    var controls = new OrbitControls(camera, renderer.domElement);
    // controls.autoRotate = true;

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

    // -------------- Import de l'objet --------------

    const mtlLoader = new MTLLoader();
    let arrayObj = [];

    const objLoader2 = new THREE.OBJLoader();

    function loadObject(nameObj, nameTexture = null) {
        mtlLoader.load("/build/3d/" + nameObj + ".mtl", function (materials) {
            materials.preload();
            let lambert, final = null;

            if (!!nameTexture) {
                // const texture = new THREE.TextureLoader().load('/build/3d/' + nameTexture);
                // lambert = new THREE.MeshPhongMaterial({ map: texture });
                materials.materials["Blob"] = lambert;
            }

            const objLoader = new OBJLoader();


            objLoader.setMaterials(materials);
            objLoader.load("/build/3d/" + nameObj + ".obj", function (object) {
                if (!!nameTexture) {
                    object.traverse(function (child) {
                        if (child instanceof THREE.Mesh) {
                            child.material = lambert;
                        }
                    });
                }

                arrayObj[nameObj] = object;
                scene.add(arrayObj[nameObj]);
            });
        });
    }

    loadObject("Caoutchouc_Test_01");
    loadObject("Cuir_Test_01");

    // -------------- Maitriser le resize de la fenêtre --------------

    window.addEventListener('resize', onWindowResize, false)
    function onWindowResize() {
        camera.aspect = boxView.clientWidth / boxView.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(boxView.clientWidth, boxView.clientHeight)
        render();
    }

    // -------------- ??? --------------

    const stats = new Stats()
    document.body.appendChild(stats.dom)

    // -------------- Création d'une animation --------------

    // On appel la fonction render pour afficher le nouveau résultat
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        render();
        stats.update();
    }

    function render() {
        renderer.render(scene, camera)
    }

    // Ici, on vérifié juste l'accès a la librairie WebGL
    // Certains navigateurs ne sont pas encore compatibles
    if (WebGL.isWebGLAvailable) {
        // Initiate function or other initializations here
        // requestAnimationFrame(animate);
        // setInterval(randomPositionGeometry, 3000, meshIco);
        animate();
    } else {
        const warning = WebGL.getWebGLErrorMessage;
        document.querySelectorAll("configurator")[0].appendChild(warning);
    }

    // -------------- PANEL FUNCTION --------------

    let propertyNumber = 1;
    const properties = $(".configuration-panel--select").data("properties").split(',');
    const selectArrow = $(".configuration-panel--select-arrow");
    const selectCounter = $(".configuration-panel--select-counter");
    const propertiesContent = $(".configuration-panel--properties");
    const property = $(".configuration-panel--property");

    function changeProperty(e) {
        const elem = $(e.currentTarget);
        const propertyName = elem.data("property");
        loadObject(properties[propertyNumber - 1], propertyName + ".png");
    }

    function presetConfigurator() {
        propertiesContent.addClass("display-none");
        $('#' + properties[0]).removeClass("display-none");
        $(".fa-long-arrow-left").addClass("arrow-grey");

        if (propertyNumber == properties.length) {
            $(".fa-long-arrow-right").addClass("arrow-grey");
        } else {
            $(".fa-long-arrow-right").removeClass("arrow-grey");
        }

        loadObject(properties[0], propertiesContent.find(".configuration-panel--property").data("property") + ".png");
    }

    function changeProperties(e) {
        const elem = $(e.target);
        const direction = elem.data("direction");

        if (direction == "left" && propertyNumber > 1) {
            propertyNumber--;
        } else if (direction == "right" && propertyNumber < properties.length) {
            propertyNumber++;
        }

        if (propertyNumber == 1) {
            $(".fa-long-arrow-left").addClass("arrow-grey");
        } else {
            $(".fa-long-arrow-left").removeClass("arrow-grey");
        }

        if (propertyNumber == properties.length) {
            $(".fa-long-arrow-right").addClass("arrow-grey");
        } else {
            $(".fa-long-arrow-right").removeClass("arrow-grey");
        }

        selectCounter.text("Property " + propertyNumber + " / " + properties.length);

        propertiesContent.addClass("display-none");
        $('#' + properties[propertyNumber - 1]).removeClass("display-none");
    }

    selectArrow.on("click", (e) => {
        changeProperties(e);
    });
    property.on("click", (e) => {
        changeProperty(e);
    });
    presetConfigurator();
});
