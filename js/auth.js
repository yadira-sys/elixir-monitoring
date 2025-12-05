// ============================================
// SISTEMA DE AUTENTICACIÓN
// Usuario y contraseña para proteger el dashboard
// ============================================

const AuthSystem = {
  // Credenciales (CAMBIAR AQUÍ)
  credentials: {
    username: 'elixir',
    password: 'elixir2025'
  },
  
  // Verificar si ya está autenticado
  isAuthenticated() {
    return sessionStorage.getItem('elixir_authenticated') === 'true';
  },
  
  // Marcar como autenticado
  setAuthenticated() {
    sessionStorage.setItem('elixir_authenticated', 'true');
  },
  
  // Cerrar sesión
  logout() {
    sessionStorage.removeItem('elixir_authenticated');
    location.reload();
  },
  
  // Mostrar modal de login
  showLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      backdrop-filter: blur(10px);
    `;
    
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 3rem;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        max-width: 400px;
        width: 90%;
        text-align: center;
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 50%;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
        ">
          🎵
        </div>
        
        <h2 style="
          color: white;
          font-size: 2rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
        ">
          ELIXIR Dashboard
        </h2>
        
        <p style="
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
          font-size: 0.95rem;
        ">
          Marketing Dashboard Profesional
        </p>
        
        <div style="text-align: left;">
          <label style="
            color: white;
            font-weight: 600;
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
          ">
            👤 Usuario
          </label>
          <input 
            type="text" 
            id="authUsername" 
            placeholder="Introduce tu usuario"
            style="
              width: 100%;
              padding: 0.8rem 1rem;
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-radius: 10px;
              background: rgba(255, 255, 255, 0.1);
              color: white;
              font-size: 1rem;
              margin-bottom: 1rem;
              backdrop-filter: blur(10px);
            "
            autocomplete="username"
          />
          
          <label style="
            color: white;
            font-weight: 600;
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
          ">
            🔒 Contraseña
          </label>
          <input 
            type="password" 
            id="authPassword" 
            placeholder="Introduce tu contraseña"
            style="
              width: 100%;
              padding: 0.8rem 1rem;
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-radius: 10px;
              background: rgba(255, 255, 255, 0.1);
              color: white;
              font-size: 1rem;
              margin-bottom: 1.5rem;
              backdrop-filter: blur(10px);
            "
            autocomplete="current-password"
          />
          
          <div id="authError" style="
            color: #fca5a5;
            background: rgba(239, 68, 68, 0.2);
            padding: 0.8rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            display: none;
            font-size: 0.9rem;
          ">
            ❌ Usuario o contraseña incorrectos
          </div>
          
          <button 
            onclick="AuthSystem.attemptLogin()"
            style="
              width: 100%;
              padding: 1rem;
              background: white;
              color: #667eea;
              border: none;
              border-radius: 10px;
              font-weight: 700;
              font-size: 1rem;
              cursor: pointer;
              transition: transform 0.2s, box-shadow 0.2s;
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.3)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
          >
            🚀 Acceder al Dashboard
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus en el input de usuario
    setTimeout(() => {
      document.getElementById('authUsername').focus();
    }, 100);
    
    // Enter para login
    document.getElementById('authPassword').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.attemptLogin();
      }
    });
  },
  
  // Intentar login
  attemptLogin() {
    const username = document.getElementById('authUsername').value;
    const password = document.getElementById('authPassword').value;
    const errorDiv = document.getElementById('authError');
    
    if (username === this.credentials.username && password === this.credentials.password) {
      // Login exitoso
      this.setAuthenticated();
      document.getElementById('authModal').remove();
      
      // Inicializar app
      if (typeof App !== 'undefined') {
        App.init();
      }
      
      // Mostrar mensaje de bienvenida
      setTimeout(() => {
        if (typeof App !== 'undefined') {
          App.showAlert('success', '🎉 Bienvenido a ELIXIR Dashboard');
        }
      }, 500);
    } else {
      // Login fallido
      errorDiv.style.display = 'block';
      document.getElementById('authPassword').value = '';
      document.getElementById('authPassword').focus();
      
      // Shake animation
      const modal = document.querySelector('#authModal > div');
      modal.style.animation = 'shake 0.5s';
      setTimeout(() => {
        modal.style.animation = '';
      }, 500);
    }
  },
  
  // Inicializar sistema de auth
  init() {
    // Agregar shake animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }
      
      #authUsername:focus,
      #authPassword:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.8) !important;
        background: rgba(255, 255, 255, 0.15) !important;
      }
    `;
    document.head.appendChild(style);
    
    if (!this.isAuthenticated()) {
      // Ocultar contenido del dashboard
      const appContainer = document.getElementById('app');
      if (appContainer) {
        appContainer.style.display = 'none';
      }
      
      // Mostrar modal de login
      this.showLoginModal();
    } else {
      // Ya está autenticado, agregar botón de logout
      this.addLogoutButton();
    }
  },
  
  // Agregar botón de logout al header
  addLogoutButton() {
    const header = document.querySelector('.header');
    if (header && !document.getElementById('logoutBtn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.innerHTML = '🚪 Cerrar Sesión';
      logoutBtn.style.cssText = `
        padding: 0.5rem 1rem;
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        margin-left: auto;
      `;
      logoutBtn.onmouseover = function() {
        this.style.background = 'rgba(239, 68, 68, 0.3)';
        this.style.borderColor = 'rgba(239, 68, 68, 0.5)';
      };
      logoutBtn.onmouseout = function() {
        this.style.background = 'rgba(239, 68, 68, 0.2)';
        this.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      };
      logoutBtn.onclick = () => {
        if (confirm('¿Cerrar sesión?')) {
          this.logout();
        }
      };
      
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.appendChild(logoutBtn);
    }
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  AuthSystem.init();
});
