// Configuração do Firebase com seus dados
const firebaseConfig = {
  apiKey: "AIzaSyBN-Dc3Tkv1-MAP4p-r5rDwlK1z41HsOq8",
  authDomain: "qrcode-752fb.firebaseapp.com",
  databaseURL: "https://qrcode-752fb-default-rtdb.firebaseio.com",
  projectId: "qrcode-752fb",
  storageBucket: "qrcode-752fb.firebasestorage.app",
  messagingSenderId: "503167640794",
  appId: "1:503167640794:web:fdc313be001df6b5bdb1e3"
};

// Inicialização
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Função para Gerar Ingressos (Portal dos Pais)
async function processarGeracao() {
    const responsavel = document.getElementById('pai').value;
    const nomesAlunos = document.querySelectorAll('.nome-aluno');
    const matsAlunos = document.querySelectorAll('.mat-aluno');
    const listaQRs = document.getElementById('listaQRs');
    
    if(!responsavel) return alert("Por favor, preencha o nome do responsável.");

    listaQRs.innerHTML = '<p class="text-center w-full">Validando e salvando ingressos...</p>';

    for(let i = 0; i < nomesAlunos.length; i++) {
        const nome = nomesAlunos[i].value;
        const matricula = matsAlunos[i].value;

        if(!nome || !matricula) continue;

        // 1. Verifica no Firebase se essa matrícula já gerou ingressos
        const snapshot = await db.ref('ingressos/' + matricula).once('value');
        const registro = snapshot.val();

        if (registro && registro.qtd >= 3) {
            alert(`Limite atingido para o aluno ${nome} (Matrícula: ${matricula}).`);
            continue;
        }

        // 2. Salva no Banco de Dados
        const ticketBaseID = `TKT-${matricula}-${Date.now()}`;
        await db.ref('ingressos/' + matricula).set({
            aluno: nome,
            responsavel: responsavel,
            qtd: 3,
            dataGeracao: new Date().toLocaleString(),
            tipo: "PADRÃO",
            evento: document.getElementById('nomeEventoModal').innerText
        });

        // 3. Exibe os 3 QR Codes na tela
        document.getElementById('modalIngresso').classList.add('hidden');
        document.getElementById('areaTickets').classList.remove('hidden');
        
        // Limpa o placeholder de carregamento se for o primeiro aluno
        if(i === 0) listaQRs.innerHTML = ''; 

        for(let j = 1; j <= 3; j++) {
            const finalID = `${ticketBaseID}-${j}`;
            criarCardTicket(nome, matricula, finalID, j);
        }
    }
}

// Função Auxiliar para Criar o Card Visual e o QR Code
function criarCardTicket(nome, mat, id, via) {
    const container = document.getElementById('listaQRs');
    const card = document.createElement('div');
    card.className = "bg-white p-8 rounded-[2rem] shadow-xl border-2 border-dashed border-gray-200 flex flex-col items-center relative";
    card.id = `card-${id}`;
    card.innerHTML = `
        <div class="absolute top-0 left-0 bg-blue-600 text-white px-4 py-1 text-[10px] font-black uppercase">Ingresso Oficial</div>
        <h4 class="text-xl font-bold text-gray-900 mt-4">${nome}</h4>
        <p class="text-gray-400 text-xs mb-6 italic">Matrícula: ${mat} | Via ${via} de 3</p>
        <div id="qr-${id}" class="p-4 bg-white border rounded-2xl"></div>
        <button onclick="baixar('${card.id}')" class="mt-6 bg-black text-white px-8 py-2 rounded-full font-bold text-sm hover:bg-blue-600 transition">Baixar PNG</button>
    `;
    container.appendChild(card);
    new QRCode(document.getElementById(`qr-${id}`), { text: id, width: 160, height: 160 });
}