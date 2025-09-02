import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ASPECT = 16 / 9;

function makeAxes(size = 2) {
    const group = new THREE.Group();
    group.add(new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), size, 0xff0000));
    group.add(new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), size, 0x00ff00));
    group.add(new THREE.ArrowHelper(new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,0), size, 0x0000ff));
    return group;
}

function matrixToString(mat) {
    const e = mat.elements;
    let s = "";
    for (let r=0; r<4; r++) {
        s += e[r]   .toFixed(2).padStart(6) + " ";
        s += e[r+4] .toFixed(2).padStart(6) + " ";
        s += e[r+8] .toFixed(2).padStart(6) + " ";
        s += e[r+12].toFixed(2).padStart(6) + "\n";
    }
    return s;
}


function createVisualization(containerId) {
    const container = document.getElementById(containerId);

    const control_container = container.parentNode.querySelector(".controls");

    const width = window.innerWidth * 3/5;
    container.style.width = width + "px";
    container.style.height = (width / ASPECT) + "px";
    // --- Setup scene ---
    const scene = new THREE.Scene();

    const grid = new THREE.GridHelper(10, 10);
    grid.rotation.x= Math.PI / 2;
    scene.add(grid);
    scene.add(new THREE.AxesHelper(2));

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth/container.clientHeight, 0.1, 100);
    camera.position.set(-5, -5, 5);
    camera.up.set(0, 0, 1);

    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);


    const controls = new OrbitControls(camera, renderer.domElement);

    const axis = makeAxes(); // length of each axis = 2 units
    scene.add(axis);

    // --- Update transform from sliders ---
    function updateTransform() {
        const tx = parseFloat(control_container.querySelector(".tx").value);
        const ty = parseFloat(control_container.querySelector(".ty").value);
        const tz = parseFloat(control_container.querySelector(".tz").value);
        const rx = THREE.MathUtils.degToRad(control_container.querySelector(".rx").value);
        const ry = THREE.MathUtils.degToRad(control_container.querySelector(".ry").value);
        const rz = THREE.MathUtils.degToRad(control_container.querySelector(".rz").value);

        const euler = new THREE.Euler(rx, ry, rz, 'ZYX'); 

        axis.position.set(tx, ty, tz);
        axis.setRotationFromEuler(euler);

        //document.getElementById('matrix').textContent = matrixToString(axis.matrix);
    }


    control_container.querySelectorAll("input").forEach(el => el.addEventListener("input", updateTransform));
    updateTransform();

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    container.addEventListener('resize', () => {
        camera.aspect = container.clientWidth/container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

createVisualization("viz1");
