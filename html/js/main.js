// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('nav ul');

mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Contact Form Functionality
function sendEmail(event) {
    event.preventDefault();
    
    // Get form data
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const company = document.getElementById('company').value;
    const service = document.getElementById('service').value;
    const message = document.getElementById('message').value;
    
    // Prepare template parameters
    const templateParams = {
        to_email: 'm.f.g.digisol@gmail.com',
        from_name: name,
        from_email: email,
        phone: phone,
        company: company,
        service: service,
        message: message
    };
    
    // Show loading state on button
    const submitBtn = document.querySelector('.submit-btn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'A enviar...';
    submitBtn.disabled = true;
    
    // Send the email using EmailJS
    emailjs.send('service_id', 'template_id', templateParams)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            
            // Reset form
            document.getElementById('contactForm').reset();
            
            // Reset file input display
            document.querySelector('.file-name').textContent = 'Nenhum ficheiro selecionado';
            
            // Show success message
            const successMessage = document.getElementById('successMessage');
            successMessage.style.display = 'flex';
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
            
            // Reset button
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }, function(error) {
            console.log('FAILED...', error);
            
            // Show error message
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.style.display = 'flex';
            
            // Hide error message after 5 seconds
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
            
            // Reset button
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
    
    return false;
}

// File input display
const fileInput = document.getElementById('attachment');
if (fileInput) {
    fileInput.addEventListener('change', function() {
        const fileName = this.files[0] ? this.files[0].name : 'Nenhum ficheiro selecionado';
        document.querySelector('.file-name').textContent = fileName;
    });
}

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Scroll Animation
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .feature, .case-study').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    observer.observe(element);
});