
from asset_optimizer import AssetOptimizer
import os

# Create a dummy image (requires PIL, but if not present, it should handle gracefully)
try:
    from PIL import Image
    img = Image.new('RGB', (100, 100), color = 'red')
    img.save('test_heavy.png')
    # Make it artificially large not possible easily without binary padding, 
    # but we can set threshold to 0 for testing.
except ImportError:
    print("PIL not found, skipping image creation.")

optimizer = AssetOptimizer(".")
print("🔍 Scanning (Threshold 0KB)...")
results = optimizer.scan_heavy_assets(threshold_kb=0)
print("Heavy assets found:", results)

# Optimize
print("✨ Optimizing...")
opt_results = optimizer.optimize_assets(threshold_kb=0)
print("Optimization results:", opt_results)

# Clean up
if os.path.exists('test_heavy.png'):
    os.remove('test_heavy.png')
if os.path.exists('test_heavy.webp'):
    os.remove('test_heavy.webp')
