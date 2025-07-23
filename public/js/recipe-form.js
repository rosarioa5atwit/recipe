document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('recipeImage');
  const previewContainer = document.getElementById('imagePreview');
  const previewImage = document.getElementById('previewImage');
  
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) {
      previewImage.src = URL.createObjectURL(file);
      previewContainer.style.display = 'block';
    } else {
      previewContainer.style.display = 'none';
    }
  });

  const addIngredientBtn = document.getElementById('addIngredientBtn');
  const ingredientsContainer = document.getElementById('ingredientsContainer');
  const ingredientTemplate = document.getElementById('ingredientTemplate');
  
  function addIngredientRow() {
    const clone = ingredientTemplate.content.cloneNode(true);
    clone.querySelector('.remove-ingredient').addEventListener('click', function() {
      this.closest('.ingredient-row').remove();
    });
    ingredientsContainer.appendChild(clone);
  }
  
  addIngredientBtn.addEventListener('click', addIngredientRow);
  addIngredientRow();

  const addStepBtn = document.getElementById('addStepBtn');
  const instructionsContainer = document.getElementById('instructionsContainer');
  
  addStepBtn.addEventListener('click', function() {
    const stepCount = instructionsContainer.children.length + 1;
    const stepDiv = document.createElement('div');
    stepDiv.className = 'instruction-step mb-3';
    stepDiv.innerHTML = `
      <div class="input-group">
        <span class="input-group-text">${stepCount}</span>
        <textarea 
          class="form-control" 
          name="instructions[]" 
          placeholder="Describe this step..."
          required
        ></textarea>
        <button type="button" class="btn btn-outline-danger remove-step">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
    if (instructionsContainer.children.length > 0) {
      instructionsContainer.querySelector('.remove-step').disabled = false;
    }
    instructionsContainer.appendChild(stepDiv);
    stepDiv.querySelector('.remove-step').addEventListener('click', function() {
      stepDiv.remove();
      document.querySelectorAll('.instruction-step').forEach((step, index) => {
        step.querySelector('.input-group-text').textContent = index + 1;
      });
      if (instructionsContainer.children.length === 1) {
        instructionsContainer.querySelector('.remove-step').disabled = true;
      }
    });
  });

  document.getElementById('recipeForm').addEventListener('submit', function(e) {
    if (document.querySelectorAll('[name="instructions[]"]').length === 0) {
      e.preventDefault();
      alert('Please add at least one instruction step');
      return;
    }
  });
});