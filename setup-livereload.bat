@echo off
echo 🚀 Setting up live reload for your recipe app...

REM Install live reload dependencies
echo 📦 Installing live reload packages...
npm install livereload connect-livereload chokidar nodemon --save-dev

echo ✅ Live reload packages installed!
echo.
echo 🎯 How to use:
echo 1. Run: npm run dev-win
echo.
echo 2. Open your browser to: http://localhost:3050
echo.
echo 3. Edit public/style.css and save - browser will auto-refresh!
echo.
echo 🔄 Live reload will watch:
echo    - public/style.css (and all CSS files)
echo    - views/*.ejs (template files)  
echo    - public/js/*.js (JavaScript files)
echo.
echo 💡 When you save any of these files, your browser will automatically refresh!

pause