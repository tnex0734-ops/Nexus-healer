// =============================================
// MediTriage — Frontend Application Logic
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initVoiceInput();
  initTriageForm();
  initAnimations();
  initCounters();
});

// --- Navbar ---
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      mobileMenuBtn.classList.toggle('active');
    });
  }

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });

        // Close mobile menu
        navLinks.classList.remove('mobile-open');
        mobileMenuBtn.classList.remove('active');
      }
    });
  });
}

// --- Voice Input (Web Speech API) ---
function initVoiceInput() {
  const voiceBtn = document.getElementById('voiceBtn');
  const voiceStatus = document.getElementById('voiceStatus');
  const symptomInput = document.getElementById('symptomInput');

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    voiceBtn.style.display = 'none';
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let isListening = false;

  voiceBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      return;
    }

    recognition.start();
    isListening = true;
    voiceBtn.classList.add('listening');
    voiceStatus.style.display = 'flex';
  });

  recognition.onresult = (event) => {
    let final = '';
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }

    if (final) {
      const existing = symptomInput.value;
      symptomInput.value = existing ? existing + ' ' + final : final;
    }
  };

  recognition.onend = () => {
    isListening = false;
    voiceBtn.classList.remove('listening');
    voiceStatus.style.display = 'none';
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    voiceBtn.classList.remove('listening');
    voiceStatus.style.display = 'none';
  };
}

// --- Triage Form ---
function initTriageForm() {
  const form = document.getElementById('triageForm');
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn = document.getElementById('resetBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const symptoms = document.getElementById('symptomInput').value.trim();
    if (!symptoms) {
      shakeElement(document.getElementById('symptomInput'));
      return;
    }

    const data = {
      symptoms,
      age: document.getElementById('ageInput').value || undefined,
      gender: document.getElementById('genderInput').value || undefined,
      bloodPressure: document.getElementById('bpInput').value || undefined,
      temperature: document.getElementById('tempInput').value || undefined,
      heartRate: document.getElementById('hrInput').value || undefined,
      oxygenLevel: document.getElementById('o2Input').value || undefined,
    };

    // Show loading
    showLoading();
    submitBtn.classList.add('btn-loading');

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      showResults(result);

      // Save to Firebase if available
      if (typeof saveAssessment === 'function') {
        saveAssessment(data, result).then(id => {
          if (id) console.log('✅ Assessment saved to Firebase:', id);
        });
      }
    } catch (error) {
      console.error('Triage request error:', error);
      showResults({
        conditions: [{ name: 'Service Error', confidence: 0, description: 'Could not connect to the triage service. Please check your connection and try again.' }],
        priority: 'MEDIUM',
        priorityReason: 'Unable to assess — please consult a healthcare professional',
        riskScore: 50,
        recommendations: ['Please try again', 'If experiencing severe symptoms, call emergency services'],
        immediateActions: ['Seek medical attention if symptoms are severe'],
        extractedSymptoms: [],
        vitalSignsAssessment: 'Unable to assess',
        disclaimer: 'Service temporarily unavailable.',
      });
    } finally {
      submitBtn.classList.remove('btn-loading');
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      showEmpty();
    });
  }
}

// --- Display States ---
function showLoading() {
  document.getElementById('resultsEmpty').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('resultsLoading').style.display = 'block';

  // Animate loading steps
  const steps = ['step1', 'step2', 'step3'];
  steps.forEach(id => {
    document.getElementById(id).className = 'loading-step';
  });
  document.getElementById('step1').classList.add('active');

  setTimeout(() => {
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('done');
    document.getElementById('step2').classList.add('active');
  }, 1500);

  setTimeout(() => {
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step2').classList.add('done');
    document.getElementById('step3').classList.add('active');
  }, 3000);
}

function showEmpty() {
  document.getElementById('resultsEmpty').style.display = 'block';
  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('resultsLoading').style.display = 'none';
}

function showResults(data) {
  document.getElementById('resultsEmpty').style.display = 'none';
  document.getElementById('resultsLoading').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';

  // Scroll to results on mobile
  if (window.innerWidth <= 1024) {
    const resultsPanel = document.getElementById('resultsPanel');
    setTimeout(() => {
      resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }

  renderPriority(data.priority, data.priorityReason);
  renderRiskScore(data.riskScore);
  renderVitals(data.vitalSignsAssessment);
  renderSymptomTags(data.extractedSymptoms);
  renderConditions(data.conditions);
  renderRecommendations(data.recommendations);
  renderActions(data.immediateActions);
  renderDisclaimer(data.disclaimer);
}

// --- Render Functions ---
function renderPriority(level, reason) {
  const banner = document.getElementById('priorityBanner');
  const label = document.getElementById('priorityLabel');
  const reasonEl = document.getElementById('priorityReason');

  // Remove existing classes
  banner.className = 'priority-banner';

  const levelLower = (level || 'medium').toLowerCase();
  banner.classList.add(`priority-${levelLower}-banner`);
  label.textContent = level || 'MEDIUM';
  reasonEl.textContent = reason || '-';
}

function renderRiskScore(score) {
  const value = score || 0;
  const valueEl = document.getElementById('riskValue');
  const bar = document.getElementById('riskBar');

  valueEl.textContent = value;

  // Set bar color based on score
  if (value >= 70) {
    bar.style.background = 'var(--danger)';
    valueEl.style.color = 'var(--danger)';
  } else if (value >= 40) {
    bar.style.background = 'var(--warning)';
    valueEl.style.color = 'var(--warning)';
  } else {
    bar.style.background = 'var(--success)';
    valueEl.style.color = 'var(--success)';
  }

  // Animate bar
  setTimeout(() => {
    bar.style.width = value + '%';
  }, 100);
}

function renderVitals(assessment) {
  const section = document.getElementById('vitalsSection');
  const text = document.getElementById('vitalsText');

  if (!assessment || assessment === 'Unable to assess') {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  text.textContent = assessment;
}

function renderSymptomTags(symptoms) {
  const container = document.getElementById('symptomTags');
  const section = document.getElementById('symptomsSection');
  container.innerHTML = '';

  if (!symptoms || symptoms.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  symptoms.forEach(symptom => {
    const tag = document.createElement('span');
    tag.className = 'symptom-tag';
    tag.textContent = symptom;
    container.appendChild(tag);
  });
}

function renderConditions(conditions) {
  const container = document.getElementById('conditionsList');
  container.innerHTML = '';

  if (!conditions || conditions.length === 0) return;

  conditions.forEach((condition, i) => {
    const card = document.createElement('div');
    card.className = 'condition-card';

    // Color based on confidence
    if (condition.confidence >= 70) {
      card.style.borderLeftColor = 'var(--danger)';
    } else if (condition.confidence >= 40) {
      card.style.borderLeftColor = 'var(--warning)';
    } else {
      card.style.borderLeftColor = 'var(--primary)';
    }

    card.innerHTML = `
      <div class="condition-header">
        <span class="condition-name">${escapeHTML(condition.name)}</span>
        <span class="condition-confidence">${condition.confidence}%</span>
      </div>
      <p class="condition-desc">${escapeHTML(condition.description)}</p>
      <div class="condition-bar-bg">
        <div class="condition-bar" style="width: 0%"></div>
      </div>
    `;

    container.appendChild(card);

    // Animate confidence bar
    setTimeout(() => {
      card.querySelector('.condition-bar').style.width = condition.confidence + '%';
      if (condition.confidence >= 70) {
        card.querySelector('.condition-bar').style.background = 'var(--danger)';
      } else if (condition.confidence >= 40) {
        card.querySelector('.condition-bar').style.background = 'var(--warning)';
      }
    }, 200 + i * 150);
  });
}

function renderRecommendations(recs) {
  const list = document.getElementById('recommendationsList');
  list.innerHTML = '';

  if (!recs || recs.length === 0) return;

  recs.forEach(rec => {
    const li = document.createElement('li');
    li.textContent = rec;
    list.appendChild(li);
  });
}

function renderActions(actions) {
  const list = document.getElementById('actionsList');
  const section = document.getElementById('actionsSection');
  list.innerHTML = '';

  if (!actions || actions.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  actions.forEach(action => {
    const li = document.createElement('li');
    li.textContent = action;
    list.appendChild(li);
  });
}

function renderDisclaimer(text) {
  const el = document.getElementById('disclaimer');
  el.textContent = text || 'This is an AI-assisted triage tool for demonstration purposes only. Always consult a qualified healthcare professional.';
}

// --- Animations ---
function initAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('[data-animate]').forEach(el => {
    observer.observe(el);
  });
}

// --- Counter Animation ---
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-count]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-count'));
  const duration = 1500;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(target * ease);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// --- Utilities ---
function shakeElement(el) {
  el.style.animation = 'shake 0.5s ease-in-out';
  el.style.borderColor = 'var(--danger)';
  setTimeout(() => {
    el.style.animation = '';
    el.style.borderColor = '';
  }, 1000);
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
