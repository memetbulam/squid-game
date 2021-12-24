// Çalışna alanı oluşturur
// perspektif kamera oluşturur
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Çalışna alanı boyutunu ayarlar
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Arkaplan rengi uygular
renderer.setClearColor(0xb7c3f3, 1);

// çalışma alanına ortam ışığı ekliyoruz
const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

// Global değişkenler
const start_position = 3;
const end_position = -start_position;
const text = document.querySelector(".text");
const time_limit = 10;
let gameStat = "loading";
let isLookingBackward = true;

// Küp oluşturma fonksiyonu
function createCube(size, positionX, rotY = 0, color = 0xfbc851) {
    const geometry = new THREE.BoxGeometry(size.w, size.h, size.d);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.x = positionX;
    cube.rotation.y = rotY;
    scene.add(cube);
    return cube;
}

camera.position.z = 5;

// GLTFLoader kullanabilmek için yeni model oluşturur
const loader = new THREE.GLTFLoader();

// Kondları geç çalıştırır
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Doll adında yeni bir sınıf oluşturduk
class Doll {
    constructor() {
        // 3d modeli yükler
        loader.load("../models/scene.gltf", (gltf) => {
            // Sahnede 3d modeli ekler
            scene.add(gltf.scene);
            // 3d modelin boyutunu ayarlar
            gltf.scene.scale.set(.4, .4, .4);
            // 3d modelin pozisyonunu ayarlar
            gltf.scene.position.set(0, -1, 0);
            // bu doll'un gltf.scene eşit olduğunu belirtir
            this.doll = gltf.scene;
        });
    }

    lookBackward() {
        // this.doll.rotation.y = 3.15;
        gsap.to(this.doll.rotation, { y: -3.15, duration: .45 });
        setTimeout(() => isLookingBackward = true, 450);
    }

    lookForward() {
        // this.doll.position.y = 0;
        gsap.to(this.doll.rotation, { y: 0, duration: .45 });
        setTimeout(() => isLookingBackward = false, 150);
    }

    async start() {
        this.lookBackward();
        await delay((Math.random() * 1000) + 1000);
        this.lookForward();
        await delay((Math.random() * 750) + 750);
        this.start();
    }
}

// Oyun alanı fonksiyonu
function createTrack() {
    // width, height, depth, positionX, rotationY, color
    createCube({ w: .2, h: 1.5, d: 1 }, start_position, -.35);
    createCube({ w: start_position * 2 + .2, h: 1.5, d: 1 }, 0, 0, 0xe5a716).position.z = -1;
    createCube({ w: .2, h: 1.5, d: 1 }, end_position, .35);
}
createTrack();

class Player {
    constructor() {
        const geometry = new THREE.SphereGeometry(.3, 32, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.z = 1;
        sphere.position.x = start_position;
        scene.add(sphere);
        this.player = sphere;
        this.playerInfo = {
            positionX: start_position,
            // Küre hızı
            velocity: 0
        }
    }

    // Kürenin ilerleme metodu
    run() {
        this.playerInfo.velocity = .03;
    }

    // Küreyi durdurma metodu
    stop() {
        // this.playerInfo.velocity = 0;
        gsap.to(this.playerInfo, { velocity: 0, duration: .1 });
    }

    // Kontrol
    check() {
        if (this.playerInfo.velocity > 0 && !isLookingBackward) {
            text.innerText = "Kaybettin!";
            gameStat = "over";
        }
        if (this.playerInfo.positionX < end_position + .4) {
            text.innerText = "Kazandın!";
            gameStat = "over";
        }
    }

    update() {
        this.check();
        this.playerInfo.positionX -= this.playerInfo.velocity;
        this.player.position.x = this.playerInfo.positionX;
    }
}

// Oluşturduğumuz sınıftan yeni bir nesne oluşturduk
const player = new Player();
let doll = new Doll();

// Oyunu başlatma fonksiyonu
async function init() {
    await delay(1000);
    text.innerText = "3 SANİYE İÇİNDE BAŞLIYOR";
    await delay(1000);
    text.innerText = "2 SANİYE İÇİNDE BAŞLIYOR";
    await delay(1000);
    text.innerText = "1 SANİYE İÇİNDE BAŞLIYOR";
    await delay(1000);
    text.innerText = "BAŞLA";
    startGame();
}

function startGame() {
    gameStat = "started";
    let progressBar = createCube({ w: 5, h: .1, d: 1 }, 0);
    progressBar.position.y = 3.35;
    gsap.to(progressBar.scale, { x: 0, duration: time_limit, ease: "none" });
    doll.start();
    setTimeout(() => {
        if (gameStat != "over") {
            text.innerText = "Süre Bitti Kaybettin!";
            gameStat = "over";
        }
    }, time_limit * 1000);
}
init();

// Sürekli çalışması için
function animate() {
    if (gameStat == "over") return;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
    player.update();
}
animate();

// Pencere boyutunu dinler
window.addEventListener('resize', onWindowResize, false);
// Ekranı yeniden boyutlandırmak için
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Tuşa basıldığında
window.addEventListener('keydown', (e) => {
    if (gameStat != "started") return
    if (e.key == "ArrowUp") {
        player.run();
    }
});

// Tuş yukarı kalkınca
window.addEventListener('keyup', (e) => {
    if (e.key == "ArrowUp") {
        player.stop();
    }
});