// Variables d'environnement
const PHONE_ID = process.env.PHONE_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

module.exports = async (req, res) => {
  console.log('=== WEBHOOK APPELÉ ===');
  console.log('Méthode:', req.method);
  console.log('Variables env:', { 
    PHONE_ID: PHONE_ID ? 'défini' : 'manquant', 
    ACCESS_TOKEN: ACCESS_TOKEN ? 'défini' : 'manquant', 
    VERIFY_TOKEN: VERIFY_TOKEN ? 'défini' : 'manquant' 
  });

  try {
    // Vérification webhook (GET) - Meta l'appelle pour vérifier
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      console.log('Vérification webhook:', { mode, token, challenge });
      
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook vérifié avec succès !');
        return res.status(200).send(challenge);
      } else {
        console.log('❌ Échec vérification webhook');
        return res.status(403).send('Forbidden');
      }
    }

    // Traitement des messages (POST)
    if (req.method === 'POST') {
      const body = req.body;
      
      console.log('📨 Webhook reçu:', JSON.stringify(body, null, 2));
      
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry[0];
        
        if (entry.changes && entry.changes[0].value.messages) {
          const message = entry.changes[0].value.messages[0];
          const from = message.from;
          const messageText = message.text?.body?.toLowerCase();

          console.log(`📱 Message reçu de ${from}: ${messageText}`);

          // Si message == "/blague"
          if (messageText === '/blague') {
            console.log('🎭 Commande /blague détectée, envoi de la blague...');
            
            // Array de blagues pour varier
            const blagues = [
              'Pourquoi les programmeurs préfèrent le mode sombre ? Parce que la lumière attire les bugs ! 😂',
              'Que dit un escargot quand il croise une limace ? "Regarde ce punk avec son crâne rasé !" 🐌',
              'Pourquoi les poissons n\'aiment pas jouer au tennis ? Parce qu\'ils ont peur du filet ! 🐟',
              'Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ? Un chat-mallow ! 🎨',
              'Que dit un informaticien quand il se noie ? F1 ! F1 ! 💻',
              'Pourquoi les développeurs n\'aiment pas la nature ? Il y a trop de bugs ! 🐛',
              'Comment appelle-t-on un magicien qui fait de la programmation ? Un coding wizard ! ⚡',
              'Que dit un serveur web en panne ? Error 500 : Je suis fatigué ! 😴'
            ];
            
            // Sélection aléatoire
            const blague = blagues[Math.floor(Math.random() * blagues.length)];
            
            // Envoi de la réponse
            await envoyerMessage(from, blague);
          }
        }
        return res.status(200).send('EVENT_RECEIVED');
      } else {
        return res.status(404).send('Not Found');
      }
    }

    return res.status(405).send('Method Not Allowed');
    
  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// Fonction pour envoyer un message
async function envoyerMessage(destinataire, texte) {
  const url = `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: destinataire,
    type: 'text',
    text: { body: texte }
  };
  
  try {
    console.log('🚀 Envoi message vers:', destinataire);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${ACCESS_TOKEN}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('✅ Message envoyé:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur envoi message:', error);
    throw error;
  }
}