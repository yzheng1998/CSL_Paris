import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import * as settings from "../../settings.json";

/**
 *
 * @param {} camera
 */

export const _setupBloom = (width, height, scene, camera, renderer) => {
    var params = {
        exposure: 1,
        bloomStrength: 0.6,
        bloomThreshold: 0,
        bloomRadius: 0.1,
        scene: "Scene with Glow",
    };
    var renderScene = new RenderPass(scene, camera);
    var bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        1,
        0.4,
        0.85
    );
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;
    let bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);
    var finalPass = new ShaderPass(
        new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: {
                    value: bloomComposer.renderTarget2.texture,
                },
            },
            vertexShader: _shaders().vertex,
            fragmentShader: _shaders().frag,
            defines: {},
        }),
        "baseTexture"
    );
    finalPass.needsSwap = true;
    let finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScene);
    finalComposer.addPass(finalPass);

    return { bloomComposer: bloomComposer, finalComposer: finalComposer };
};

/**
 *
 * @param {
 * } trips
 */

export const _blockCamera = (camera) => {
    if (camera) {
        let p = camera.position;
        if (p.y < 0.3) p.y = 0.3;
        if (p.y > 4) p.y = 4;
    }
};

/***
 *
 *
 */
export const _setupAgents = async () => {
    let agentsWrapper = new THREE.Object3D();
    for (const tripName in settings.trips) {
        let URL = settings.trips[tripName].URL;

        fetch(URL)
            .then((res) => res.json())
            .then((tripsData) => {
                let thisTripsAgents = _makeAgents(tripsData, tripName);
                thisTripsAgents.name = tripName;
                // adds a record of the trips to the
                // THREEE obj so we can run anim from inside
                // this oject itself
                thisTripsAgents.trips = tripsData;
                agentsWrapper.add(thisTripsAgents);
            })
            .catch((err) => console.error(err));
    }
    agentsWrapper.rotation.set(0, 0.4625123, 0);
    agentsWrapper.position.set(
        -(Math.cos(0.4625123) * 822) / 2000 - 1.57 / 2,
        0,
        (Math.sin(0.4625123) * 822) / 2000 - 0.92 / 2
    );
    agentsWrapper.rotation.set(0, 0.4625123, 0);
    return agentsWrapper;
};

const _makeAgents = (trips, tripName) => {
    let scale = 0.015;
    let color = new THREE.Color();
    color.setHSL(
        settings.trips[tripName].color.h,
        settings.trips[tripName].color.s,
        settings.trips[tripName].color.l
    );

    let textLoader = new THREE.TextureLoader();
    let spriteText = textLoader.load("./resources/textures/agent.png");
    spriteText.minFilter = THREE.LinearFilter;
    let spritesWarpper = new THREE.Object3D();
    for (let i = 0; i < trips.length; i++) {
        var spriteMaterial = new THREE.SpriteMaterial({
            map: spriteText,
            transparent: true,
        });

        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.material.color = color;
        sprite.material.blending = THREE.AdditiveBlending;
        sprite.material.transparent = true;
        sprite.scale.set(scale, scale, scale);
        sprite.position.set(0, 0, 0);
        spritesWarpper.add(sprite);
    }
    return spritesWarpper;
};

/**
 *
 *
 */

export const _loadOBJmodel = async (url) => {
    console.log("start obj model load...");
    return new Promise((resolve) => {
        new OBJLoader().load(url, resolve);
    }).then((result) => {
        return result;
    });
};

/**
 *
 * @param {*} renderer
 * @param {*} scene
 */

const _shaders = () => {
    const _vertexShader = () => {
        return `
    varying vec2 vUv;
       void main() {
           vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `;
    };
    //
    const _fragmentshader = () => {
        return ` 
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;
    vec4 getTexture( sampler2D texelToLinearTexture ) {
        return mapTexelToLinear( texture2D( texelToLinearTexture , vUv ) );
    }
    void main() {
        gl_FragColor = ( getTexture( baseTexture ) + vec4( 1.0 ) * getTexture( bloomTexture ) );
    }`;
    };

    return { vertex: _vertexShader(), frag: _fragmentshader() };
};

/**
 *
 * @param {*} renderer
 * @param {*} scene
 */
// ! should consider https://tinyurl.com/wqpozgh

export const _createFloor = (renderer, scene) => {
    // Create a floor.
    var loader = new THREE.TextureLoader();

    loader.load("./resources/textures/floor/WOOD_SML.jpg", function (texture) {
        texture.minFilter = THREE.LinearFilter;
        var repeatX = 15;
        var repeatY = 15;

        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);

        var normal = loader.load("./resources/textures/floor/NRM.jpg");
        normal.anisotropy = renderer.capabilities.getMaxAnisotropy();
        normal.wrapS = THREE.RepeatWrapping;
        normal.wrapT = THREE.RepeatWrapping;
        normal.repeat.set(repeatX, repeatY);

        var ao = loader.load("./resources/textures/floor/GLOSS.jpg");
        ao.anisotropy = renderer.capabilities.getMaxAnisotropy();
        ao.wrapS = THREE.RepeatWrapping;
        normal.wrapT = THREE.RepeatWrapping;
        ao.repeat.set(repeatX, repeatY);

        var displace = loader.load("./resources/textures/floor/WOOD_DISP.jpg");
        displace.minFilter = THREE.LinearFilter;

        displace.anisotropy = renderer.capabilities.getMaxAnisotropy();
        displace.wrapS = THREE.RepeatWrapping;
        displace.wrapT = THREE.RepeatWrapping;
        displace.repeat.set(repeatX, repeatY);

        var material = new THREE.MeshStandardMaterial({
            aoMap: ao,
            aoMapIntensity: 1,
            color: 0xffffff,
            map: texture,
            metalnessMap: texture,
            displacementMap: displace,
            displacementScale: 0.1,
            normalMap: normal,
            metalness: 5,
            roughness: 0.5,
        });

        const planeSize = 50;
        const planeMesh = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(planeSize, planeSize),
            material
        );
        planeMesh.receiveShadow = true;
        planeMesh.rotation.x = Math.PI * -0.5;
        planeMesh.position.y = 0;
        planeMesh.position.z = 0;

        scene.add(planeMesh);
    });
};
