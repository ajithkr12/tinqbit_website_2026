document.getElementById('year').textContent = new Date().getFullYear();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

document.querySelectorAll('.accordion details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('.accordion details').forEach((other) => {
      if (other !== detail) other.open = false;
    });
  });
});

document.getElementById('lead-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const business = document.getElementById('business').value.trim() || 'Not provided';
  const market = document.getElementById('market').value;
  const plan = document.getElementById('plan').value;
  const message = document.getElementById('message').value.trim() || 'I would like to know more about the e-commerce website.';

  const text = [
    'Hi Tinqbit, I am interested in launching an e-commerce website.',
    '',
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Business: ${business}`,
    `Selling in: ${market}`,
    `Preferred package: ${plan}`,
    `Details: ${message}`
  ].join('\n');

  window.open(`https://wa.me/919995657744?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
});

document.querySelectorAll('[data-plan]').forEach((button) => {
  button.addEventListener('click', () => {
    document.getElementById('plan').value = button.dataset.plan;
  });
});
