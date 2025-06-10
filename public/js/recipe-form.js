document.addEventListener('DOMContentLoaded', () => {
  // Image Preview
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

  // Add Ingredient Functionality
  const addIngredientBtn = document.getElementById('addIngredientBtn');
  const ingredientsContainer = document.getElementById('ingredientsContainer');
  const ingredientTemplate = document.getElementById('ingredientTemplate');
  
  function addIngredientRow() {
    const clone = ingredientTemplate.content.cloneNode(true);
    
    // Add remove functionality
    clone.querySelector('.remove-ingredient').addEventListener('click', function() {
      this.closest('.ingredient-row').remove();
    });
    
    ingredientsContainer.appendChild(clone);
  }
  
  addIngredientBtn.addEventListener('click', addIngredientRow);
  
  // Add initial ingredient row
  addIngredientRow();
  
  // Instructions Steps Management
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
    
    // Enable remove button if more than one step
    if (instructionsContainer.children.length > 0) {
      instructionsContainer.querySelector('.remove-step').disabled = false;
    }
    
    instructionsContainer.appendChild(stepDiv);
    
    // Add remove functionality
    stepDiv.querySelector('.remove-step').addEventListener('click', function() {
      stepDiv.remove();
      // Renumber remaining steps
      document.querySelectorAll('.instruction-step').forEach((step, index) => {
        step.querySelector('.input-group-text').textContent = index + 1;
      });
      // Disable remove if only one left
      if (instructionsContainer.children.length === 1) {
        instructionsContainer.querySelector('.remove-step').disabled = true;
      }
    });
  });
  
  // Form Submission Handling
  document.getElementById('recipeForm').addEventListener('submit', function(e) {
    // Only preventDefault if validation fails
    if (document.querySelectorAll('[name="instructions[]"]').length === 0) {
      e.preventDefault();
      alert('Please add at least one instruction step');
      return;
    }
    // Do NOT call e.preventDefault() here otherwise!
  });
});