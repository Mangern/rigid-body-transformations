import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ASPECT = 16 / 9;
const EPS = 1e-5;

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

    const reset_btn = control_container.querySelector(".reset");
    if (reset_btn) {
        reset_btn.addEventListener("click", () => {
            control_container.querySelector(".tx").value = "0";
            control_container.querySelector(".ty").value = "0";
            control_container.querySelector(".tz").value = "0";
            control_container.querySelector(".rx").value = "0";
            control_container.querySelector(".ry").value = "0";
            control_container.querySelector(".rz").value = "0";
            control_container.querySelector(".rz").dispatchEvent(new Event("input")); // trigger normal input stuff
        });
    }

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

    return container.parentNode;
}

const viz1 = createVisualization("viz1");
const viz1showros = () => {
    const tx = viz1.querySelector(".tx").value;
    const ty = viz1.querySelector(".ty").value;
    const tz = viz1.querySelector(".tz").value;
    const rx = THREE.MathUtils.degToRad(viz1.querySelector(".rx").value);
    const ry = THREE.MathUtils.degToRad(viz1.querySelector(".ry").value);
    const rz = THREE.MathUtils.degToRad(viz1.querySelector(".rz").value);

    viz1.querySelector(".ros2cmd").innerHTML = `ros2 run tf2_ros static_transform_publisher --frame-id parent --child-frame-id child --x ${tx} --y ${ty} --z ${tz} --roll ${rx} --pitch ${ry} --yaw ${rz}`;
}
viz1.querySelectorAll("input").forEach(el => el.addEventListener("input", viz1showros));

const viz2 = createVisualization("viz2");
const viz2showros = () => {
    const tx = viz2.querySelector(".tx").value;
    const ty = viz2.querySelector(".ty").value;
    const tz = viz2.querySelector(".tz").value;
    const rx = THREE.MathUtils.degToRad(viz2.querySelector(".rx").value);
    const ry = THREE.MathUtils.degToRad(viz2.querySelector(".ry").value);
    const rz = THREE.MathUtils.degToRad(viz2.querySelector(".rz").value);

    viz2.querySelector(".ros2cmd").innerHTML = `ros2 run tf2_ros static_transform_publisher --frame-id gcs --child-frame-id launch_pad --x ${tx} --y ${ty} --z ${tz}`;
}

const viz2verify = () => {
    const tx = parseFloat(viz2.querySelector(".tx").value);
    const ty = parseFloat(viz2.querySelector(".ty").value);
    const tz = parseFloat(viz2.querySelector(".tz").value);
    const rx = THREE.MathUtils.degToRad(viz2.querySelector(".rx").value);
    const ry = THREE.MathUtils.degToRad(viz2.querySelector(".ry").value);
    const rz = THREE.MathUtils.degToRad(viz2.querySelector(".rz").value);

    const success = (
        (Math.abs(tx - 5.0) < EPS) &&
        (Math.abs(ty - 2.0) < EPS) &&
        (Math.abs(tz + 1.0) < EPS) &&
        (Math.abs(rx - 0.0) < EPS) &&
        (Math.abs(ry - 0.0) < EPS) &&
        (Math.abs(rz - 0.0) < EPS)
    );

    const status_el = viz2.querySelector(".status");
    if (success) {
        status_el.innerHTML = "Success!";
    } else {
        status_el.innerHTML = "";
    }
}
viz2showros();
viz2verify();


viz2.querySelectorAll("input").forEach(el => el.addEventListener("input", viz2showros));
viz2.querySelectorAll("input").forEach(el => el.addEventListener("input", viz2verify));

const viz3 = createVisualization("viz3");
const viz3showros = () => {
    const tx = viz3.querySelector(".tx").value;
    const ty = viz3.querySelector(".ty").value;
    const tz = viz3.querySelector(".tz").value;
    const rx = THREE.MathUtils.degToRad(viz3.querySelector(".rx").value);
    const ry = THREE.MathUtils.degToRad(viz3.querySelector(".ry").value);
    const rz = THREE.MathUtils.degToRad(viz3.querySelector(".rz").value);

    viz3.querySelector(".ros2cmd").innerHTML = `ros2 run tf2_ros static_transform_publisher --frame-id gcs --child-frame-id launch_pad --x ${tx} --y ${ty} --z ${tz} --roll ${rx} --pitch ${ry} --yaw ${rz}`;
}

const viz3verify = () => {
    const tx = parseFloat(viz3.querySelector(".tx").value);
    const ty = parseFloat(viz3.querySelector(".ty").value);
    const tz = parseFloat(viz3.querySelector(".tz").value);
    const rx = THREE.MathUtils.degToRad(viz3.querySelector(".rx").value);
    const ry = THREE.MathUtils.degToRad(viz3.querySelector(".ry").value);
    const rz = THREE.MathUtils.degToRad(viz3.querySelector(".rz").value);

    const success = (
        (Math.abs(tx - 5.0) < EPS) &&
        (Math.abs(ty - 2.0) < EPS) &&
        (Math.abs(tz + 1.0) < EPS) &&
        (Math.abs(rx - 0.0) < EPS) &&
        (Math.abs(ry - 0.0) < EPS) &&
        (Math.abs(rz - Math.PI / 2) < EPS)
    );

    const status_el = viz3.querySelector(".status");
    if (success) {
        status_el.innerHTML = "Success!";
    } else {
        status_el.innerHTML = "";
    }
}
viz3showros();
viz3verify();


viz3.querySelectorAll("input").forEach(el => el.addEventListener("input", viz3showros));
viz3.querySelectorAll("input").forEach(el => el.addEventListener("input", viz3verify));

const viz4 = createVisualization("viz4");
const viz4showros = () => {
    const tx = viz4.querySelector(".tx").value;
    const ty = viz4.querySelector(".ty").value;
    const tz = viz4.querySelector(".tz").value;
    const rx = THREE.MathUtils.degToRad(viz4.querySelector(".rx").value);
    const ry = THREE.MathUtils.degToRad(viz4.querySelector(".ry").value);
    const rz = THREE.MathUtils.degToRad(viz4.querySelector(".rz").value);

    viz4.querySelector(".ros2cmd").innerHTML = `ros2 run tf2_ros static_transform_publisher --frame-id drone_flu --child-frame-id camera --x ${tx} --y ${ty} --z ${tz} --roll ${rx} --pitch ${ry} --yaw ${rz}`;
}

const viz4verify = () => {
    const tx = parseFloat(viz4.querySelector(".tx").value);
    const ty = parseFloat(viz4.querySelector(".ty").value);
    const tz = parseFloat(viz4.querySelector(".tz").value);
    const rx = THREE.MathUtils.degToRad(viz4.querySelector(".rx").value);
    const ry = THREE.MathUtils.degToRad(viz4.querySelector(".ry").value);
    const rz = THREE.MathUtils.degToRad(viz4.querySelector(".rz").value);

    const success = (
        (Math.abs(tx - 0.2) < EPS) &&
        (Math.abs(ty - 0.0) < EPS) &&
        (Math.abs(tz + 0.05) < EPS) &&
        (Math.abs(rx - Math.PI) < EPS) &&
        (Math.abs(ry - 0.0) < EPS) &&
        (Math.abs(rz + Math.PI / 2) < EPS)
    );

    const status_el = viz4.querySelector(".status");
    if (success) {
        status_el.innerHTML = "Success!";
    } else {
        status_el.innerHTML = "";
    }
}
viz4showros();
viz4verify();


viz4.querySelectorAll("input").forEach(el => el.addEventListener("input", viz4showros));
viz4.querySelectorAll("input").forEach(el => el.addEventListener("input", viz4verify));

