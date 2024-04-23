import * as THREE from 'three';

const defaultParameters = {
    penumbra: 1,
    intensity: 68,
    width: 1024 * 4,
    height: 1024 * 4,
    near: 35
}

class Lights {
    static entryLight() {
        const entryLight = new THREE.SpotLight(0xffffff, 7);

        entryLight.castShadow = true;
        entryLight.shadow.mapSize.width = defaultParameters.width;
        entryLight.shadow.mapSize.height = defaultParameters.height;
        entryLight.shadow.camera.near = defaultParameters.near;
        entryLight.penumbra = defaultParameters.penumbra;
        entryLight.intensity = defaultParameters.intensity;

        entryLight.angle = 0.06;
        entryLight.position.x = 20;
        entryLight.position.y = 240;
        entryLight.position.z = -160;

        entryLight.rotation.x = -7.6;
        entryLight.rotation.y = 0;
        entryLight.rotation.z = 0;

        entryLight.target.position.x = 42;
        entryLight.target.position.y = -70;
        entryLight.target.position.z = 50;

        entryLight.target.updateMatrixWorld();

        return (entryLight);
    }

    static sunLight() {
        const sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);

        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = defaultParameters.width;
        sunLight.shadow.mapSize.height = defaultParameters.height;
        sunLight.shadow.camera.near = defaultParameters.near;
        sunLight.penumbra = defaultParameters.penumbra;
        sunLight.intensity = 1;

        sunLight.position.x = 10;
        sunLight.position.y = 100;
        sunLight.position.z = -506;

        sunLight.target.updateMatrixWorld();

        return (sunLight);
    }

    static testLight(scene) {
        var light = new THREE.PointLight(0xFFFFFF, 1.5);
        /* position the light so it shines on the cube (x, y, z) */
        light.position.set(10, 0, 80);
        scene.add(light);

        // so many lights
        var light = new THREE.DirectionalLight(0xffffff, 10);
        light.position.set(0, 1, 0);
        scene.add(light);

        var light = new THREE.DirectionalLight(0xffffff, 5);
        light.position.set(0, -1, 0);
        scene.add(light);

        var light = new THREE.DirectionalLight(0xffffff, 10);
        light.position.set(1, 0, 0);
        scene.add(light);

        var light = new THREE.DirectionalLight(0xffffff, 5);
        light.position.set(0, 0, 1);
        scene.add(light);

        var light = new THREE.DirectionalLight(0xffffff, 10);
        light.position.set(0, 0, -1);
        scene.add(light);

        var light = new THREE.DirectionalLight(0xffffff, 5);
        light.position.set(-1, 0, 0);
        scene.add(light);

    }
}
export default Lights;

