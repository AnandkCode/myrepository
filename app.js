class WhatsAppDPOptimizer {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.setupEventListeners();
    }

    initializeElements() {
        // Upload elements
        this.dropZone = document.getElementById('drop-zone');
        this.imageUpload = document.getElementById('image-upload');
        
        // Editor elements
        this.editorContainer = document.getElementById('editor-container');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.ctx = this.previewCanvas.getContext('2d');
        
        // Control elements
        this.blurSlider = document.getElementById('blur-slider');
        this.blurValue = document.getElementById('blur-value');
        this.sizeButtons = document.querySelectorAll('.size-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.downloadBtn = document.getElementById('download-btn');
        
        // Info elements
        this.originalDimensions = document.getElementById('original-dimensions');
        this.finalDimensions = document.getElementById('final-dimensions');
        this.loadingOverlay = document.querySelector('.loading-overlay');
    }

    initializeState() {
        this.uploadedImage = null;
        this.canvasSize = 500; // Default size
        this.blurIntensity = 20;
        this.processing = false;
    }

    setupEventListeners() {
        // Upload handlers
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (this.validateImage(file)) {
                this.handleImageUpload(file);
            }
        });

        this.dropZone.addEventListener('click', () => {
            this.imageUpload.click();
        });

        this.imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (this.validateImage(file)) {
                this.handleImageUpload(file);
            }
        });

        // Control handlers
        this.blurSlider.addEventListener('input', (e) => {
            this.blurIntensity = parseInt(e.target.value);
            this.blurValue.textContent = this.blurIntensity;
            if (this.uploadedImage) {
                this.processImage();
            }
        });

        this.sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.sizeButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.canvasSize = parseInt(btn.dataset.size);
                this.finalDimensions.textContent = `Final: ${this.canvasSize} x ${this.canvasSize}`;
                if (this.uploadedImage) {
                    this.processImage();
                }
            });
        });

        this.resetBtn.addEventListener('click', () => {
            this.resetEditor();
        });

        this.downloadBtn.addEventListener('click', () => {
            this.downloadImage();
        });
    }

    validateImage(file) {
        if (!file) return false;

        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a valid image file (JPEG, PNG, or GIF)');
            return false;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('Image size should be less than 10MB');
            return false;
        }

        return true;
    }

    handleImageUpload(file) {
        this.showLoading();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.uploadedImage = img;
                this.originalDimensions.textContent = `Original: ${img.width} x ${img.height}`;
                this.editorContainer.classList.remove('hidden');
                this.processImage();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async processImage() {
        if (this.processing) return;
        this.processing = true;
        this.showLoading();

        // Set canvas dimensions
        this.previewCanvas.width = this.canvasSize;
        this.previewCanvas.height = this.canvasSize;

        try {
            await this.renderImage();
        } catch (error) {
            console.error('Error processing image:', error);
            alert('An error occurred while processing the image. Please try again.');
        } finally {
            this.hideLoading();
            this.processing = false;
        }
    }

    async renderImage() {
        const img = this.uploadedImage;
        const ratio = img.width / img.height;

        // Create offscreen canvas for blur effect
        const offscreen = document.createElement('canvas');
        offscreen.width = this.canvasSize * 1.2;
        offscreen.height = this.canvasSize * 1.2;
        const offCtx = offscreen.getContext('2d');

        // Calculate dimensions for background
        let bgWidth, bgHeight;
        if (ratio > 1) {
            bgHeight = offscreen.height;
            bgWidth = bgHeight * ratio;
        } else {
            bgWidth = offscreen.width;
            bgHeight = bgWidth / ratio;
        }

        // Draw and blur background
        const bgX = (offscreen.width - bgWidth) / 2;
        const bgY = (offscreen.height - bgHeight) / 2;

        // Apply high-quality blur effect
        offCtx.filter = `blur(${this.blurIntensity}px)`;
        offCtx.drawImage(img, bgX, bgY, bgWidth, bgHeight);

        // Draw blurred background
        this.ctx.drawImage(
            offscreen,
            -offscreen.width * 0.1,
            -offscreen.height * 0.1,
            offscreen.width,
            offscreen.height
        );

        // Calculate dimensions for main image
        let drawWidth, drawHeight, offsetX, offsetY;
        if (ratio > 1) {
            drawWidth = this.canvasSize;
            drawHeight = this.canvasSize / ratio;
            offsetX = 0;
            offsetY = (this.canvasSize - drawHeight) / 2;
        } else {
            drawHeight = this.canvasSize;
            drawWidth = this.canvasSize * ratio;
            offsetX = (this.canvasSize - drawWidth) / 2;
            offsetY = 0;
        }

        // Draw main image
        this.ctx.filter = 'none';
        this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Apply subtle vignette effect
        const gradient = this.ctx.createRadialGradient(
            this.canvasSize / 2, this.canvasSize / 2, this.canvasSize * 0.3,
            this.canvasSize / 2, this.canvasSize / 2, this.canvasSize
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
    }

    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    resetEditor() {
        this.uploadedImage = null;
        this.editorContainer.classList.add('hidden');
        this.blurSlider.value = 20;
        this.blurIntensity = 20;
        this.blurValue.textContent = '20';
        this.canvasSize = 500;
        this.sizeButtons.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.size === '500');
        });
        this.originalDimensions.textContent = 'Original: 0 x 0';
        this.finalDimensions.textContent = 'Final: 500 x 500';
    }

    downloadImage() {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `whatsapp-dp-${timestamp}.png`;
        link.href = this.previewCanvas.toDataURL('image/png');
        link.click();
    }
}

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new WhatsAppDPOptimizer();
});
