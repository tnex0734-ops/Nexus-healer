// Firebase Configuration for Nexus Healer
// Using the COMPAT CDN (loaded via <script> tags in HTML)
// Do NOT use "import" syntax — the compat SDK provides global firebase object

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "nexus-healer.firebaseapp.com",
  projectId: "nexus-healer",
  storageBucket: "nexus-healer.firebasestorage.app",
  messagingSenderId: "267351834105",
  appId: "1:267351834105:web:ea08e03c43f59096a65128",
  measurementId: "G-S6EKKRF7J8"
};

// Initialize Firebase (compat SDK)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
console.log('✅ Firebase connected to project:', firebaseConfig.projectId);

// Save assessment to Firestore
async function saveAssessment(inputData, resultData) {
  try {
    const assessment = {
      // Patient Input
      symptoms: inputData.symptoms || '',
      age: inputData.age || null,
      gender: inputData.gender || '',
      bloodPressure: inputData.bloodPressure || '',
      temperature: inputData.temperature || null,
      heartRate: inputData.heartRate || null,
      oxygenLevel: inputData.oxygenLevel || null,

      // AI Results
      priority: resultData.priority || 'MEDIUM',
      riskScore: resultData.riskScore || 0,
      conditions: resultData.conditions || [],
      recommendations: resultData.recommendations || [],
      immediateActions: resultData.immediateActions || [],
      extractedSymptoms: resultData.extractedSymptoms || [],
      vitalSignsAssessment: resultData.vitalSignsAssessment || '',
      priorityReason: resultData.priorityReason || '',

      // Metadata
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    const docRef = await db.collection('assessments').add(assessment);
    console.log('✅ Assessment saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving assessment:', error);
    return null;
  }
}

// Get all assessments (for admin dashboard)
async function getAssessments(filters = {}) {
  try {
    let query = db.collection('assessments').orderBy('createdAt', 'desc');

    if (filters.priority) {
      query = query.where('priority', '==', filters.priority);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    const assessments = [];

    snapshot.forEach(doc => {
      assessments.push({ id: doc.id, ...doc.data() });
    });

    return assessments;
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return [];
  }
}

// Get assessment stats
async function getAssessmentStats() {
  try {
    const snapshot = await db.collection('assessments').get();
    const stats = {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      avgRiskScore: 0,
      todayCount: 0
    };

    let totalRisk = 0;
    const today = new Date().toISOString().split('T')[0];

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;
      totalRisk += data.riskScore || 0;

      if (data.priority === 'HIGH') stats.high++;
      else if (data.priority === 'MEDIUM') stats.medium++;
      else stats.low++;

      if (data.createdAt && data.createdAt.startsWith(today)) {
        stats.todayCount++;
      }
    });

    stats.avgRiskScore = stats.total > 0 ? Math.round(totalRisk / stats.total) : 0;
    return stats;
  } catch (error) {
    console.error('Error getting stats:', error);
    return { total: 0, high: 0, medium: 0, low: 0, avgRiskScore: 0, todayCount: 0 };
  }
}

// Delete assessment
async function deleteAssessment(id) {
  try {
    await db.collection('assessments').doc(id).delete();
    return true;
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return false;
  }
}
