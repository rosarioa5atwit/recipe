document.addEventListener('DOMContentLoaded', async () => {
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

  // Fetch ingredients and units from API
  const [ingredients, units] = await Promise.all([
    fetch('/api/ingredients').then(res => res.json()),
    fetch('/api/units').then(res => res.json())
  ]);
  
  // Populate ingredient datalist
  const datalist = document.getElementById('ingredientList');
  ingredients.forEach(ingredient => {
    const option = document.createElement('option');
    option.value = ingredient.name || ingredient; // Support both array of strings and array of objects
    datalist.appendChild(option);
  });
  
  // Add Ingredient Functionality
  const addIngredientBtn = document.getElementById('addIngredientBtn');
  const ingredientsContainer = document.getElementById('ingredientsContainer');
  const ingredientTemplate = document.getElementById('ingredientTemplate');
  
  function addIngredientRow() {
    const clone = ingredientTemplate.content.cloneNode(true);
    const unitSelect = clone.querySelector('.ingredient-unit');
    
    // Populate units
    units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit.id;
      option.textContent = unit.abbreviation ? `${unit.name} (${unit.abbreviation})` : unit.name;
      unitSelect.appendChild(option);
    });
    
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
    // Validate at least one instruction step
    if (document.querySelectorAll('[name="instructions[]"]').length === 0) {
      e.preventDefault();
      alert('Please add at least one instruction step');
      return;
    }
    
    // Collect ingredients data
    const ingredients = [];
    document.querySelectorAll('.ingredient-row').forEach(row => {
      ingredients.push({
        name: row.querySelector('.ingredient-name').value,
        amount: parseFloat(row.querySelector('.ingredient-amount').value),
        unit_id: parseInt(row.querySelector('.ingredient-unit').value)
      });
    });
    
    // Add hidden input with ingredients JSON
    const ingredientsInput = document.createElement('input');
    ingredientsInput.type = 'hidden';
    ingredientsInput.name = 'ingredients';
    ingredientsInput.value = JSON.stringify(ingredients);
    this.appendChild(ingredientsInput);
  });
});