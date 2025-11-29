const isEAPCheckbox = document.getElementById('isEAP');
const inputsIsEAP = document.getElementById('inputsIsEAP');
const inputsIsNotEAP = document.getElementById('inputsIsNotEAP');

// Show or hide eap or normal wifi configs
function toggleEAPSection() {
    if (isEAPCheckbox.checked) {        
        // Shows EAP configs
        inputsIsEAP.classList.remove('hidden');

        Array.from(inputsIsEAP.children).forEach(input => {
            input.setAttribute('required', true);
        });

        Array.from(inputsIsNotEAP.children).forEach(input => {
            input.removeAttribute('required');
        });

        inputsIsNotEAP.classList.add('hidden');
    } else {    
        // Shows non EAP configs
        inputsIsNotEAP.classList.remove('hidden');          
        
        Array.from(inputsIsNotEAP.children).forEach(input => {
            input.setAttribute('required', true);
        });

        Array.from(inputsIsEAP.children).forEach(input => {
            input.removeAttribute('required');
        });

        inputsIsEAP.classList.add('hidden');
    }
}

// Called initially to set the initial state
document.addEventListener('DOMContentLoaded', toggleEAPSection());

