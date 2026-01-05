/* CONFIGURATION */
const EMAIL_DOMAIN = "@kpriet.ac.in";
const CURRENCY_API_URL = "https://open.er-api.com/v6/latest/";

const ALLOWED_ROLL_NUMBERS = [
    "24cs188", "24cs189", "24cs190", "24cs191", "24cs192", "24cs193", "24cs194", 
    "24cs195", "24cs196", "24cs197", "24cs198", "24cs199", "24cs200", "24cs201", 
    "24cs202", "24cs203", "24cs204", "24cs205", "24cs206", "24cs207", "24cs208", 
    "24cs209", "24cs210", "24cs211", "24cs212", "24cs213", "24cs214", "24cs215", 
    "24cs216", "24cs217", "24cs218", "24cs219", "24cs220", "24cs221", "24cs222", 
    "24cs223", "24cs224", "24cs225", "24cs226", "24cs227", "24cs228", "24cs229", 
    "24cs230", "24cs231", "24cs232", "24cs233", "24cs234", "24cs235", "24cs236", 
    "24cs237", "24cs238", "24cs239", "24cs240", "24cs241", "24cs242", "24cs243", 
    "24cs244", "24cs245", "24cs246", "24cs247", "24cs248", "24cs249", "24cs250", 
    "24cs251", "24cs257", "24cs264", "24cs270", "24cs278", "24cs279", "24cs280", 
    "24cs290", "25csl19", "25csl20", "25csl21", "25csl22"
];

class CalculatorApp {
    constructor() {
        this.user = null;
        this.history = [];
        this.geminiKey = localStorage.getItem("geminiKey") || "";
        this.currentTheme = localStorage.getItem("theme") || "cyber";
        this.init();
    }

    init() {
        this.applyTheme();
        this.loadUser();
        this.loadHistory();
        this.initToastContainer(); // NEW: Initialize Toast System
        this.detectPage();
    }

    // --- UI HELPERS: TOAST & TYPEWRITER ---
    initToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    showToast(msg, type = 'info') {
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span><i class="${type === 'error' ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'}"></i> ${msg}</span>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;cursor:pointer;">×</button>
        `;
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    typeText(element, text) {
        element.innerHTML = '<span class="typing-cursor"></span>';
        const cursor = element.querySelector('.typing-cursor');
        let i = 0;
        
        // Clear any previous typing interval if it exists on this element
        if(element.typingInterval) clearInterval(element.typingInterval);

        element.typingInterval = setInterval(() => {
            if (i < text.length) {
                // Insert text before the cursor
                cursor.insertAdjacentText('beforebegin', text.charAt(i));
                i++;
            } else {
                clearInterval(element.typingInterval);
                // Keep cursor blinking for a moment, then remove or keep based on preference
                // cursor.remove(); // Uncomment to remove cursor after typing
            }
        }, 20); // Typing speed (lower is faster)
    }

    detectPage() {
        if (document.getElementById("userDetailsForm")) this.initLogin();
        if (document.querySelector(".calculator-grid")) this.initHome();
    }

    initSidebar() {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");
        const openBtn = document.getElementById("menuToggleBtn");
        const closeBtn = document.getElementById("closeSidebarBtn");

        const toggle = () => {
            sidebar.classList.toggle("active");
            overlay.classList.toggle("active");
        };

        openBtn.onclick = toggle;
        closeBtn.onclick = toggle;
        overlay.onclick = toggle;

        document.getElementById("themeToggleBtn").onclick = () => this.toggleTheme();
        document.getElementById("resetAppBtn").onclick = () => this.resetApp();
        document.getElementById("logoutBtn").onclick = () => { localStorage.removeItem("calculatorUser"); window.location.href = "main.html"; };
        document.getElementById("historyBtn").onclick = () => { toggle(); this.openModal("history"); };
        document.getElementById("downloadPdfBtn").onclick = () => this.downloadPDF();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === "cyber" ? "light" : "cyber";
        localStorage.setItem("theme", this.currentTheme);
        this.applyTheme();
    }

    applyTheme() { document.body.setAttribute("data-theme", this.currentTheme); }

    resetApp() {
        if(confirm("⚠ RESET WARNING: Clear all data?")) {
            localStorage.clear();
            window.location.href = "main.html";
        }
    }

    initLogin() {
        const form = document.getElementById("userDetailsForm");
        const emailInput = document.getElementById("userEmail");
        const errorMsg = document.getElementById("emailError");
        if(!form) return;

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = emailInput.value.trim().toLowerCase();
            if (!email.includes("@")) { errorMsg.style.display = 'block'; return; }
            const userRollNo = email.split('@')[0];
            const userDomain = "@" + email.split('@')[1];

            if (userDomain !== EMAIL_DOMAIN || !ALLOWED_ROLL_NUMBERS.includes(userRollNo)) {
                errorMsg.style.display = 'block'; return;
            }
            this.user = { name: document.getElementById("userName").value, email: email };
            localStorage.setItem("calculatorUser", JSON.stringify(this.user));
            window.location.href = "home.html";
        });
    }

    initHome() {
        if (!this.user) { window.location.href = "main.html"; return; }
        document.getElementById("displayUserName").textContent = this.user.name.toUpperCase();
        this.initSidebar();
        document.getElementById("modalClose").onclick = () => this.closeModal();
        document.querySelectorAll(".tool-card").forEach(card => card.onclick = () => this.openModal(card.dataset.calculator));
    }

    loadUser() { const saved = localStorage.getItem("calculatorUser"); if (saved) this.user = JSON.parse(saved); }
    loadHistory() { 
        const saved = localStorage.getItem("calcHistory");
        this.history = saved ? JSON.parse(saved) : []; 
    }
    
    addToHistory(eqn, res) {
        this.history.unshift({ eqn, res, time: new Date().toLocaleTimeString() });
        if (this.history.length > 20) this.history.pop();
        localStorage.setItem("calcHistory", JSON.stringify(this.history));
    }

    downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Z's TOOLBOXXX LOGS", 14, 20);
        
        doc.setFontSize(12);
        doc.text(`User: ${this.user.name}`, 14, 30);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 37);
        
        if (this.history.length > 0) {
            const tableData = this.history.map(h => [h.time, h.eqn, h.res]);
            doc.autoTable({
                startY: 45,
                head: [['Time', 'Command', 'Result']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [0, 0, 0] },
                styles: { fontSize: 10 }
            });
        } else {
            doc.text("No history available.", 14, 50);
        }
        
        doc.save('Zs_Toolboxxx_Log.pdf');
    }

    renderHistory() {
        if (!this.history.length) return `<p style="text-align:center">NO LOGS FOUND.</p>`;
        return this.history.map(item => `
            <div style="border-bottom:1px solid var(--border); padding:10px 0; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text-muted); font-size:0.8rem;">${item.time}</span> 
                <span style="font-weight:bold; margin:0 10px;">${item.eqn}</span> 
                <span style="color:var(--primary);">${item.res}</span>
            </div>
        `).join("");
    }

    openModal(type) {
        document.getElementById("modalContainer").classList.add("active");
        const title = document.getElementById("modalTitle");
        const body = document.getElementById("modalBody");
        title.textContent = type === 'history' ? "SYSTEM LOGS" : type.toUpperCase();

        if (type === "history") { body.innerHTML = this.renderHistory(); return; }

        const templates = {
            ai: `
                <input type="password" id="geminiKey" class="modal-input" placeholder="API KEY (Gemini)" value="${this.geminiKey}">
                <div class="grid-2" style="margin-bottom:10px;">
                    <button id="micBtn" class="calc-btn">🎤 VOICE</button>
                    <button id="askAiBtn" class="calc-btn primary">EXECUTE</button>
                </div>
                <textarea id="aiPrompt" class="modal-input" placeholder="INPUT QUERY..." style="min-height:100px; resize:vertical"></textarea>
                <div id="aiResponse" class="result-display">WAITING FOR INPUT...</div>
            `,

            matrix: `
                <div class="grid-2" style="margin-bottom:10px;">
                    <input type="number" id="matRows" class="modal-input" value="2" placeholder="ROWS" min="1" max="5">
                    <input type="number" id="matCols" class="modal-input" value="2" placeholder="COLS" min="1" max="5">
                </div>
                <button id="genMatBtn" class="calc-btn" style="margin-bottom:15px; width:100%">INITIALIZE GRID</button>
                <div id="matrixArea" style="display:none; flex-direction:column; gap:15px;">
                    <div style="text-align:center; color:var(--text-muted)">MATRIX A</div>
                    <div id="matA_container" style="display:grid; gap:5px;"></div>
                    <div style="text-align:center; color:var(--text-muted)">MATRIX B</div>
                    <div id="matB_container" style="display:grid; gap:5px;"></div>
                    <label style="color:var(--text-muted); font-size:0.8rem">OPERATION:</label>
                    <select id="matOp" class="modal-input">
                        <option value="add">Add (A + B)</option>
                        <option value="sub">Subtract (A - B)</option>
                        <option value="mul">Multiply (A * B)</option>
                        <option value="det">Determinant (A)</option>
                        <option value="trans">Transpose (A)</option>
                        <option value="inv">Inverse (A)</option>
                    </select>
                    <button id="calcMatBtn" class="calc-btn primary" style="width:100%">CALCULATE</button>
                </div>
                <div id="resultBox" class="result-display"></div>`,
            
            truth: `
                <input type="text" id="truthExpr" class="modal-input" placeholder="A and B or not C">
                <button id="truthBtn" class="calc-btn primary" style="width:100%">GENERATE TABLE</button>
                <div id="resultBox" class="result-display" style="font-family:monospace; overflow-x:auto; white-space:pre;"></div>`,

            currency: `
                <div class="grid-2">
                    <input type="number" id="currAmt" class="modal-input" value="1">
                    <select id="currBase" class="modal-input"><option value="USD">USD</option><option value="INR">INR</option><option value="EUR">EUR</option></select>
                </div>
                <div style="text-align:center; margin:5px; color:var(--primary)">⬇ TO ⬇</div>
                <select id="currTgt" class="modal-input"><option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option></select>
                <button id="currBtn" class="calc-btn primary" style="width:100%">CONVERT</button>
                <div id="resultBox" class="result-display"></div>`,
            
            unit: `
                <input type="number" id="unitVal" class="modal-input" placeholder="VALUE">
                <select id="unitType" class="modal-input">
                    <optgroup label="Length"><option value="m_km">Meters → KM</option><option value="km_m">KM → Meters</option></optgroup>
                    <optgroup label="Data"><option value="mb_gb">MB → GB</option><option value="gb_mb">GB → MB</option></optgroup>
                    <optgroup label="Temp"><option value="c_f">Celsius → Fahr</option><option value="f_c">Fahr → Celsius</option></optgroup>
                </select>
                <button id="unitBtn" class="calc-btn primary" style="width:100%">CONVERT</button>
                <div id="resultBox" class="result-display"></div>`,
            
            morse: `
                <input type="text" id="morseIn" class="modal-input" placeholder="ENTER TEXT">
                <div class="grid-2">
                    <button id="morseBtn" class="calc-btn primary">ENCODE</button>
                    <button id="showMorseChartBtn" class="calc-btn">CHART</button>
                </div>
                <div id="morseChartArea" style="display:none; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-top: 15px; padding: 10px; border:1px solid var(--border);"></div>
                <div id="resultBox" class="result-display"></div>`,

            qrcode: `<input id="qrText" class="modal-input" placeholder="DATA"><button id="qrBtn" class="calc-btn primary" style="width:100%">GENERATE QR</button><div id="qrOutput" style="display:flex;justify-content:center;margin-top:20px; background:white; padding:10px; border-radius:4px;"></div>`,
            
            aspect: `<div class="grid-2"><input id="arW" class="modal-input" placeholder="W"><input id="arH" class="modal-input" placeholder="H"></div><input id="arNewW" class="modal-input" placeholder="NEW WIDTH"><button id="aspBtn" class="calc-btn primary" style="width:100%">RESIZE</button><div id="resultBox" class="result-display"></div>`,
            
            tip: `
                <div class="grid-2">
                    <input id="billAmt" class="modal-input" type="number" placeholder="Bill Amount">
                    <input id="tipPer" class="modal-input" type="number" placeholder="Tip % (e.g. 10)">
                </div>
                <input id="numPeople" class="modal-input" type="number" placeholder="Number of People" value="1" min="1">
                <button id="tipBtn" class="calc-btn primary" style="width:100%">CALCULATE SPLIT</button>
                <div id="resultBox" class="result-display"></div>
            `,
            
            // Age Calculator Template (using Date Picker)
            dob: `
                <label style="color:var(--text-muted); font-size:0.9rem">Select Date of Birth:</label>
                <input type="date" id="dobIn" class="modal-input">
                <button id="dobBtn" class="calc-btn primary" style="width:100%">CALC STATS</button>
                <div id="resultBox" class="result-display" style="display:block; line-height:1.6"></div>
            `
        };

        body.innerHTML = templates[type] || `<p>ERROR LOADING MODULE</p>`;
        this.attachListeners(type);
    }

    closeModal() { document.getElementById("modalContainer").classList.remove("active"); }

    attachListeners(type) {
        const resultBox = document.getElementById("resultBox");
        
        // NEW: Display helper now uses Typewriter effect
        const display = (msg) => { 
            if(resultBox) this.typeText(resultBox, String(msg)); 
        };

        // AI
        if (type === "ai") {
            document.getElementById("micBtn").onclick = () => {
                const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                if(!SR) return this.showToast("BROWSER NOT SUPPORTED", "error");
                const r = new SR(); r.start();
                r.onresult = (e) => document.getElementById("aiPrompt").value = e.results[0][0].transcript;
            };
            document.getElementById("askAiBtn").onclick = async () => {
                const p = document.getElementById("aiPrompt").value;
                const k = document.getElementById("geminiKey").value;
                if(!p || !k) return this.showToast("MISSING INPUT OR API KEY", "error");
                
                localStorage.setItem("geminiKey", k);
                const respBox = document.getElementById("aiResponse");
                respBox.innerHTML = "PROCESSING..."; // Static text while loading
                
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${k}`, {
                        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({contents:[{parts:[{text:p}]}]})
                    });
                    const d = await res.json();
                    const rawText = d.candidates[0].content.parts[0].text;
                    const parsedHtml = marked.parse(rawText); // Parse Markdown
                    
                    // Note: Typewriter for HTML is complex, so we just set HTML for AI response
                    // or type raw text. For complex markdown, direct HTML is safer:
                    respBox.innerHTML = parsedHtml; 
                    this.addToHistory("AI Query", "Success");
                } catch(e) { 
                    respBox.innerHTML = "CONNECTION ERROR"; 
                    this.showToast("AI CONNECTION FAILED", "error");
                }
            };
        }

        // Morse
        if(type==='morse') { 
             const m={'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----'}; 
             document.getElementById("morseBtn").onclick=()=>{ 
                 const txt = document.getElementById("morseIn").value.toUpperCase();
                 const res = txt.split('').map(c=>m[c]||c).join(' ');
                 display(res);
                 this.addToHistory(`Morse: ${txt}`, res);
             }
             document.getElementById("showMorseChartBtn").onclick = (e) => {
                 const chart = document.getElementById("morseChartArea");
                 if(chart.style.display==='none') {
                     chart.style.display='grid';
                     chart.innerHTML = Object.entries(m).map(([k,v])=>`<div style="font-size:0.8rem; color:var(--text-muted)"><b style="color:var(--primary)">${k}</b> ${v}</div>`).join('');
                     e.target.textContent="HIDE CHART";
                 } else { chart.style.display='none'; e.target.textContent="SHOW CHART"; }
             };
        }

        // MATRIX
        if (type === "matrix") {
            document.getElementById("genMatBtn").onclick = () => {
                const r = document.getElementById("matRows").value;
                const c = document.getElementById("matCols").value;
                const gen = (id) => {
                    const el = document.getElementById(id);
                    el.style.gridTemplateColumns = `repeat(${c}, 1fr)`;
                    el.innerHTML = '';
                    for(let i=0; i<r*c; i++) el.innerHTML += `<input type="number" class="mat-cell" style="width:100%; background:var(--bg-color); border:1px solid var(--border); color:var(--text-main); padding:5px;">`;
                };
                gen('matA_container'); gen('matB_container');
                document.getElementById("matrixArea").style.display = 'flex';
                this.showToast("Matrix Grid Initialized", "success");
            };
            
            document.getElementById("calcMatBtn").onclick = () => {
                const r = parseInt(document.getElementById("matRows").value);
                const c = parseInt(document.getElementById("matCols").value);
                const getMat = (id) => {
                    const inputs = [...document.querySelectorAll(`#${id} input`)].map(i => parseFloat(i.value) || 0);
                    let mat = [];
                    while(inputs.length) mat.push(inputs.splice(0, c));
                    return mat;
                };
                const matA = getMat('matA_container');
                const matB = getMat('matB_container');
                const op = document.getElementById("matOp").value;
                let res;
                try {
                    if (op === 'add') res = math.add(matA, matB);
                    if (op === 'sub') res = math.subtract(matA, matB);
                    if (op === 'mul') res = math.multiply(matA, matB);
                    if (op === 'det') {
                        if(r !== c) throw new Error("Need Square Matrix");
                        res = math.det(matA);
                        this.addToHistory(`Matrix Det`, res);
                        return display(`Determinant: ${res}`);
                    }
                    if (op === 'trans') res = math.transpose(matA);
                    if (op === 'inv') res = math.inv(matA);
                    
                    let output = "RESULT:\n";
                    if (Array.isArray(res)) {
                        res.forEach(row => { output += `[ ${row.map(n => typeof n === 'number' ? parseFloat(n.toFixed(2)) : n).join(', ')} ]\n`; });
                    } else { output += res; }
                    
                    display(output); // Typewriter handles the pre-formatted text well
                    this.addToHistory(`Matrix ${op}`, "Calculated");
                } catch(e) { 
                    display(`ERROR: ${e.message}`); 
                    this.showToast("Matrix Calculation Error", "error");
                }
            }
        }

        // Truth Table
        if (type === "truth") {
            document.getElementById("truthBtn").onclick = () => {
                try {
                    const expr = document.getElementById("truthExpr").value;
                    const node = math.parse(expr);
                    const vars = node.filter(n => n.isSymbolNode).map(n => n.name).sort().filter((v, i, a) => a.indexOf(v) === i);
                    let table = `${vars.join(" | ")} | OUT\n${"-".repeat(vars.length*5)}\n`;
                    for(let i=0; i<Math.pow(2, vars.length); i++) {
                        const scope = {};
                        vars.forEach((v, idx) => { scope[v] = (i.toString(2).padStart(vars.length, '0')[idx] === '1'); });
                        table += `${vars.map(v=>scope[v]?1:0).join(" | ")} | ${node.evaluate(scope)?1:0}\n`;
                    }
                    display(table);
                    this.addToHistory(`Truth Table`, expr);
                } catch(e) { 
                    display("SYNTAX ERROR"); 
                    this.showToast("Invalid Logic Expression", "error");
                }
            }
        }

        // Currency
        if (type === "currency") document.getElementById("currBtn").onclick = async () => {
            try {
                const b = document.getElementById("currBase").value;
                const t = document.getElementById("currTgt").value;
                const a = document.getElementById("currAmt").value;
                const r = await fetch(`${CURRENCY_API_URL}${b}`).then(res=>res.json());
                const val = (a*r.rates[t]).toFixed(2);
                display(`${a} ${b} = ${val} ${t}`);
                this.addToHistory(`Forex ${b}->${t}`, val);
            } catch(e){
                display("API ERROR");
                this.showToast("Currency API Failed", "error");
            }
        };

        // Unit
        if(type==='unit') document.getElementById("unitBtn").onclick=()=>{ 
            const v=parseFloat(document.getElementById("unitVal").value), t=document.getElementById("unitType").value;
            const map={'m_km':v/1000,'km_m':v*1000,'mb_gb':v/1024,'gb_mb':v*1024, 'c_f':(v*9/5)+32, 'f_c':(v-32)*5/9};
            const res = map[t] !== undefined ? map[t].toFixed(2) : "ERR";
            display(res);
            this.addToHistory(`Unit Conv`, res);
        };

        // QR
        if(type==='qrcode') document.getElementById("qrBtn").onclick=()=>{ 
            const t=document.getElementById("qrText").value; 
            document.getElementById("qrOutput").innerHTML=""; 
            new QRCode(document.getElementById("qrOutput"),{text:t,width:100,height:100});
            this.showToast("QR Code Generated", "success");
            this.addToHistory("QR Gen", t);
        }

        // Aspect
        if(type==='aspect') document.getElementById("aspBtn").onclick=()=>{ 
            const w=document.getElementById("arW").value, h=document.getElementById("arH").value, nw=document.getElementById("arNewW").value; 
            const res = ((h/w)*nw).toFixed(0);
            display(`NEW H: ${res}`);
            this.addToHistory("Aspect Ratio", `H: ${res}`);
        }

        // Tip Splitter
        if(type==='tip') {
            document.getElementById("tipBtn").onclick=()=>{ 
                const b = parseFloat(document.getElementById("billAmt").value) || 0;
                const t = parseFloat(document.getElementById("tipPer").value) || 0;
                const p = parseInt(document.getElementById("numPeople").value) || 1;
                
                const tipAmt = b * (t/100);
                const total = b + tipAmt;
                const perPerson = total / p;
                
                // Using simple text for typewriter, HTML structure might break typewriter animation
                // So we construct a string for display, or bypass typewriter for complex HTML
                // Here we use typewriter with a formatted string
                const msg = `Total: ${total.toFixed(2)}\nTip: ${tipAmt.toFixed(2)}\nPer Person: ${perPerson.toFixed(2)}`;
                display(msg); 
                this.addToHistory("Bill Split", `Total: ${total.toFixed(2)}, Each: ${perPerson.toFixed(2)}`);
            }
        }

        // Age Calculator
        if(type==='dob') {
            document.getElementById("dobBtn").onclick=()=>{ 
                const dobVal = document.getElementById("dobIn").value;
                if(!dobVal) return this.showToast("Please select a date.", "error");
                
                const dob = new Date(dobVal);
                const now = new Date();
                const diff = now - dob; // ms
                
                if (diff < 0) return this.showToast("Future Date Selected!", "error");

                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);
                const years = (days / 365.25).toFixed(1);

                // Simple text format for typewriter
                const msg = `Age: ${years} Years\nDays: ${days.toLocaleString()}\nHours: ${hours.toLocaleString()}\nMinutes: ${minutes.toLocaleString()}\nSeconds: ${seconds.toLocaleString()}`;
                display(msg); 
                this.addToHistory("Age Calc", `${years} Years`);
            }
        }
    }
}

new CalculatorApp();