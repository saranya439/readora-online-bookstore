import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAs-1HJ0CUvrklSTvfHynFX6-qIxPhO-X4",
    authDomain: "readora-226b9.firebaseapp.com",
    projectId: "readora-226b9",
    storageBucket: "readora-226b9.firebasestorage.app",
    messagingSenderId: "680990071975",
    appId: "1:680990071975:web:f589a06075175b7f388f82"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let allBooks = [];
let cart = [];

// --- AUTH LOGIC ---
window.toggleAuthMode = () => {
    const nameField = document.getElementById('username');
    const isLogin = nameField.classList.contains('hidden');
    nameField.classList.toggle('hidden');
    document.getElementById('auth-title').innerText = isLogin ? "Readora Sign Up" : "Readora Login";
    document.getElementById('submit-btn').innerText = isLogin ? "Sign Up" : "Login";
    document.getElementById('toggle-btn').innerText = isLogin ? "Login" : "Sign Up";
};

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        if (document.getElementById('username').classList.contains('hidden')) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", res.user.uid), { email });
        }
    } catch (err) { alert(err.message); }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadBooks();
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }
});

// --- DASHBOARD DATA ---
async function loadBooks() {
    const snapshot = await getDocs(collection(db, "books"));
    allBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderGrid(allBooks);
}

function renderGrid(books) {
    const grid = document.getElementById('book-grid');
    grid.innerHTML = books.map(book => {
        const img = book.imageUrl || 'https://via.placeholder.com/300x400?text=No+Cover';
        return `
        <div class="book-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-4">
            <div class="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <img src="${img}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/300x400?text=Image+Error'">
            </div>
            <p class="text-[10px] font-bold text-indigo-500 uppercase mb-1">${book.category || 'General'}</p>
            <h3 class="text-lg font-bold text-gray-900 leading-tight">${book.name}</h3>
            <p class="text-gray-500 italic text-sm mb-2">by ${book.author}</p>
            <div class="flex justify-between items-center mt-auto">
                <span class="text-xl font-black text-gray-900">$${parseFloat(book.price).toFixed(2)}</span>
                <button onclick="addToCart('${book.name}', ${book.price})" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition">Add to Cart</button>
            </div>
        </div>`;
    }).join('');
}

// --- CART LOGIC ---
window.addToCart = (name, price) => {
    cart.push({ name, price: parseFloat(price) });
    document.getElementById('cart-count').innerText = cart.length;
    alert(`${name} added to cart!`);
};

window.toggleCart = () => {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('hidden');
    renderCartItems();
};

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    const totalDisplay = document.getElementById('cart-total-price');
    
    if (cart.length === 0) {
        list.innerHTML = `<p class="text-center text-gray-400 mt-20">Your cart is empty.</p>`;
        totalDisplay.innerText = "$0.00";
        return;
    }

    let total = 0;
    list.innerHTML = cart.map((item, index) => {
        total += item.price;
        return `
            <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                    <p class="font-bold text-gray-800 text-sm">${item.name}</p>
                    <p class="text-xs text-indigo-600">$${item.price.toFixed(2)}</p>
                </div>
                <button onclick="removeFromCart(${index})" class="text-red-400 hover:text-red-600 text-xs font-bold">Remove</button>
            </div>`;
    }).join('');
    totalDisplay.innerText = `$${total.toFixed(2)}`;
}

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    document.getElementById('cart-count').innerText = cart.length;
    renderCartItems();
};

// --- GLOBAL UTILS ---
window.logout = () => signOut(auth);

document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allBooks.filter(b => b.name.toLowerCase().includes(term) || b.author.toLowerCase().includes(term));
    renderGrid(filtered);
});