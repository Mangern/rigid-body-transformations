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

function quatApproxEquals(q1, q2) {
    return (1 - Math.abs(q1.dot(q2))) < EPS;
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
function makeFlyer() {
    const group = new THREE.Group();

    // Body: small box
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.2, 0.2),
        new THREE.MeshPhongMaterial({color: 0x00ffcc})
    );
    //body.setRotationFromEuler(new THREE.Euler(0.0, Math.PI / 2, 0.0));
    group.add(body);

    // Nose: cone pointing forward (x+ direction)
    const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.4, 16),
        new THREE.MeshPhongMaterial({color: 0xfc8302})
    );
    nose.position.x = 0.35;
    nose.rotation.z = -Math.PI / 2; // point along +X
    group.add(nose);

    return group;
}


function createStaticVisualization(containerId) {
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

function createDynamicVisualization(containerId, get_tx = () => 0, get_ty = () => 0, get_tz = () => 0, get_rx = () => 0, get_ry = () => 0, get_rz = () => 0) {
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

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xa0a0a0));

    const flyer = makeFlyer();
    scene.add(flyer);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth/container.clientHeight, 0.1, 100);
    camera.position.set(-5, -5, 5);
    camera.up.set(0, 0, 1);

    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);


    const controls = new OrbitControls(camera, renderer.domElement);

    const axis = makeAxes(); // length of each axis = 2 units
    scene.add(axis);

    const ctx = {
        container: container.parentNode,
        flyer: flyer,
        axis: axis
    }

    // --- Update transform from sliders ---
    function updateTransform() {
        let tx, ty, tz, rx, ry, rz;

        try { tx = get_tx(ctx); } catch { tx = 0; };
        try { ty = get_ty(ctx); } catch { ty = 0; };
        try { tz = get_tz(ctx); } catch { tz = 0; };
        try { rx = get_rx(ctx); } catch { rx = 0; };
        try { ry = get_ry(ctx); } catch { ry = 0; };
        try { rz = get_rz(ctx); } catch { rz = 0; };

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
    const clock = new THREE.Clock();

    const PERIOD = 1;
    let cnt = 0;

    function animate() {
        requestAnimationFrame(animate);

        const t = clock.getElapsedTime(); // seconds since start
        const radius = 3.0;
        const speed = 0.8; // radians per second

        // Circular motion in XY plane
        flyer.position.x = radius * Math.cos(speed * t);
        flyer.position.y = radius * Math.sin(speed * t);
        flyer.position.z = 1.0; // keep it above ground

        // Optional: make it face tangent direction
        //flyer.lookAt(flyer.position.x - speed * Math.sin(speed*t), flyer.position.y + speed* Math.cos(speed * t), flyer.position.z);
        //flyer.rotateOnAxis(new THREE.Vector3(0,0,1), speed * t + Math.PI/2);
        flyer.setRotationFromEuler(new THREE.Euler(
            0, 0, speed * t + Math.PI / 2
        ));

        controls.update();
        if ((++cnt) % PERIOD == 0) {
            updateTransform();
        }

        renderer.render(scene, camera);
    }
    animate();

    container.addEventListener('resize', () => {
        camera.aspect = container.clientWidth/container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    return ctx;
}


const viz1 = createStaticVisualization("viz1");
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

const viz2 = createStaticVisualization("viz2");
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

    const euler = new THREE.Euler(rx, ry, rz, 'ZYX'); 
    let q = new THREE.Quaternion().setFromEuler(euler);


    const success = (
        (Math.abs(tx - 5.0) < EPS) &&
        (Math.abs(ty - 2.0) < EPS) &&
        (Math.abs(tz + 1.0) < EPS) &&
        quatApproxEquals(q, new THREE.Quaternion().identity())
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

const viz3 = createStaticVisualization("viz3");
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

    const euler = new THREE.Euler(rx, ry, rz, 'ZYX'); 
    let q = new THREE.Quaternion().setFromEuler(euler);

    const success = (
        (Math.abs(tx - 5.0) < EPS) &&
        (Math.abs(ty - 2.0) < EPS) &&
        (Math.abs(tz + 1.0) < EPS) &&
        quatApproxEquals(q, new THREE.Quaternion(0.0, 0.0, 0.7071067811865475, 0.7071067811865475))
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

const viz4 = createStaticVisualization("viz4");
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

    const euler = new THREE.Euler(rx, ry, rz, 'ZYX'); 
    let q = new THREE.Quaternion().setFromEuler(euler);

    const success = (
        (Math.abs(tx - 0.2) < EPS) &&
        (Math.abs(ty - 0.0) < EPS) &&
        (Math.abs(tz + 0.05) < EPS) &&
        quatApproxEquals(q, new THREE.Quaternion(0.7071067811865475, -0.7071067811865475, 0.0, 0.0))
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

const viz5 = createDynamicVisualization("viz5", 
    (ctx) => { // get_tx
        const expr = ctx.container.querySelector(".tx").value || "0";
        const func = new Function("pos_x", "pos_y", "pos_z", "return " + expr);
        return func(ctx.flyer.position.x, ctx.flyer.position.y, ctx.flyer.position.z);
    },
    (ctx) => { // get_ty
        const expr = ctx.container.querySelector(".ty").value || "0";
        const func = new Function("pos_x", "pos_y", "pos_z", "return " + expr);
        return func(ctx.flyer.position.x, ctx.flyer.position.y, ctx.flyer.position.z);
    },
    (ctx) => { // get_tz
        const expr = ctx.container.querySelector(".tz").value || "0";
        const func = new Function("pos_x", "pos_y", "pos_z", "return " + expr);
        return func(ctx.flyer.position.x, ctx.flyer.position.y, ctx.flyer.position.z);
    },
    (ctx) => {
        return parseFloat(ctx.container.querySelector(".rx").value) || 0.0;
    },
    (ctx) => {
        return parseFloat(ctx.container.querySelector(".ry").value) || 0.0;
    },
    (ctx) => {
        return parseFloat(ctx.container.querySelector(".rz").value) || 0.0;
    },
);

const viz5verify = () => {
    const status_el = viz5.container.querySelector(".status");
    status_el.style.color = "black";
    status_el.innerHTML = "Checking...";
    const TRIES = 40;
    const TIMEOUT = 5;
    let num_left = TRIES;
    let num_good = 0;

    const verify = () => {
        if (viz5.container.querySelector(".frame_id").value.trim() != "launch_pad") {
            return false;
        }
        if (viz5.container.querySelector(".child_frame_id").value.trim() != "drone_flu") {
            return false;
        }
        if (viz5.container.querySelector(".tf_broadcaster").value.trim() != "sendTransform") {
            return false;
        }
        for (const el of viz5.container.querySelectorAll(".transform")) {
            if (el.value.trim() != "transform") return false;
        }
        if (num_good / TRIES < 0.9) {
            return false;
        }
        return true;
    }

    // scuffed check position
    const handler = () => {
        const tx = viz5.axis.position.x;
        const ty = viz5.axis.position.y;
        const tz = viz5.axis.position.z;
        const fx = viz5.flyer.position.x;
        const fy = viz5.flyer.position.y;
        const fz = viz5.flyer.position.z;
        const good = (
            (Math.abs(tx - fx) < EPS) &&
            (Math.abs(ty - fy) < EPS) &&
            (Math.abs(tz - fz) < EPS)
        );

        if (good) {
            ++num_good;
        }

        if (num_left-- > 0) {
            setTimeout(handler, TIMEOUT);
        } else {
            if (verify()) {
                status_el.style.color = "#08d700";
                status_el.innerHTML = "Success!";
            } else {
                status_el.innerHTML = "";
            }
        }
    }
    setTimeout(handler, TIMEOUT);

}

viz5verify();
viz5.container.querySelectorAll("input").forEach(el => el.addEventListener("input", viz5verify));

const viz6 = createDynamicVisualization("viz6",
    (ctx) => { // get_tx
        const expr = ctx.container.querySelector(".tx").value || "0";
        const func = new Function("pos_x", "pos_y", "pos_z", "heading_rad", "return " + expr);
        return func(ctx.flyer.position.x, ctx.flyer.position.y, ctx.flyer.position.z, 0.0);
    },
    (ctx) => { // get_ty
        const expr = ctx.container.querySelector(".ty").value || "0";
        const func = new Function("pos_x", "pos_y", "pos_z", "heading_rad", "return " + expr);
        return func(ctx.flyer.position.x, ctx.flyer.position.y, ctx.flyer.position.z, 0.0);
    },
    (ctx) => { // get_tz
        const expr = ctx.container.querySelector(".tz").value || "0";
        const func = new Function("pos_x", "pos_y", "pos_z", "heading_rad", "return " + expr);
        return func(ctx.flyer.position.x, ctx.flyer.position.y, ctx.flyer.position.z, 0.0);
    },
    (ctx) => {
        const expr = ctx.container.querySelector(".rx").value || "0";
        const func = new Function("pos_x", "pos_y", "pos_z", "heading_rad", "return " + expr);
        return func(ctx.flyer.position.x, ctx.flyer.position.y, ctx.flyer.position.z, 0.0);
    },
    (ctx) => {
        const expr = ctx.container.querySelector(".ry").value || "0";
        const func = new Function("pos_x", "pos_y", "pos_z", "heading_rad", "return " + expr);
        return func(ctx.flyer.position.x, ctx.flyer.position.y, ctx.flyer.position.z, 0.0);
    },
    (ctx) => {
        const expr = ctx.container.querySelector(".rz").value || "0";
        const func = new Function("pos_x", "pos_y", "pos_z", "heading_rad", "return " + expr);
        const euler = new THREE.Euler();
        euler.setFromQuaternion(ctx.flyer.quaternion, 'ZYX'); // extrinsic ZYX

        return func(ctx.flyer.position.x, ctx.flyer.position.y, ctx.flyer.position.z, euler.z);
    },
);

const viz6verify = () => {
    const status_el = viz6.container.querySelector(".status");
    status_el.style.color = "black";
    status_el.innerHTML = "Checking...";
    const TRIES = 40;
    const TIMEOUT = 5;
    let num_left = TRIES;
    let num_good = 0;

    const verify = () => {
        if (viz6.container.querySelector(".frame_id").value.trim() != "launch_pad") {
            return false;
        }
        if (viz6.container.querySelector(".child_frame_id").value.trim() != "drone_flu") {
            return false;
        }
        if (viz6.container.querySelector(".tf_broadcaster").value.trim() != "sendTransform") {
            return false;
        }
        for (const el of viz6.container.querySelectorAll(".transform")) {
            if (el.value.trim() != "transform") return false;
        }
        if (num_good / TRIES < 0.9) {
            return false;
        }
        return true;
    }

    // scuffed check position
    const handler = () => {
        const tx = viz6.axis.position.x;
        const ty = viz6.axis.position.y;
        const tz = viz6.axis.position.z;

        const fx = viz6.flyer.position.x;
        const fy = viz6.flyer.position.y;
        const fz = viz6.flyer.position.z;

        const good = (
            (Math.abs(tx - fx) < EPS) &&
            (Math.abs(ty - fy) < EPS) &&
            (Math.abs(tz - fz) < EPS) && 
            quatApproxEquals(viz6.axis.quaternion, viz6.flyer.quaternion)
        );

        if (good) {
            ++num_good;
        }

        if (num_left-- > 0) {
            setTimeout(handler, TIMEOUT);
        } else {
            if (verify()) {
                status_el.style.color = "#08d700";
                status_el.innerHTML = "Success!";
            } else {
                status_el.innerHTML = "";
            }
        }
    }
    setTimeout(handler, TIMEOUT);

}

viz6.container.querySelectorAll("input").forEach(el => el.addEventListener("input", viz6verify));
viz6verify();
