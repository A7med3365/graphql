// Initialize particles.js
particlesJS('particles-js', {
  particles: {
    number: {
      value: 50,
      density: {
        enable: true,
        value_area: 800
      }
    },
    color: {
      value: '#64b5f6'
    },
    shape: {
      type: 'circle'
    },
    opacity: {
      value: 0.5,
      random: false
    },
    size: {
      value: 3,
      random: true
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: '#64b5f6',
      opacity: 0.2,
      width: 1
    },
    move: {
      enable: true,
      speed: 2,
      direction: 'none',
      random: false,
      straight: false,
      out_mode: 'out',
      bounce: false
    }
  },
  interactivity: {
    detect_on: 'canvas',
    events: {
      onhover: {
        enable: true,
        mode: 'grab'
      },
      resize: true
    },
    modes: {
      grab: {
        distance: 140,
        line_linked: {
          opacity: 0.5
        }
      }
    }
  },
  retina_detect: true
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const credentials = btoa(`${username}:${password}`);
  try {
    const response = await fetch('https://learn.reboot01.com/api/auth/signin', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      // console.log({ data });
      localStorage.setItem('jwt', data);
      window.location.href = 'profile.html';
    } else {
      handleErrorResponse(response);
    }
  } catch (error) {
    document.getElementById('error-message').textContent =
      'Network error. Please check your connection and try again.';
  }
});

// Function to handle different types of HTTP response errors
function handleErrorResponse(response) {
  const errorMessage = document.getElementById('error-message');
  switch (response.status) {
    case 404:
      errorMessage.textContent =
        'The login service could not be found. Please check the URL or try again later.';
      break;
    case 401:
    case 403:
      errorMessage.textContent = 'Invalid username or password.';
      break;
    case 500:
      errorMessage.textContent = 'Server error. Please try again later.';
      break;
    default:
      errorMessage.textContent =
        'An unexpected error occurred. Please try again.';
  }
}
