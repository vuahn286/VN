// Thêm biến toàn cục để theo dõi trạng thái ghi âm
let isRecording = false;
let recognition = null;
let silenceTimeout = null;

// Chức năng speech-to-text cải tiến
function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert('Trình duyệt không hỗ trợ nhận dạng giọng nói');
        return;
    }

    // Khởi tạo recognition nếu chưa có
    if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Bật chế độ ghi liên tục
        recognition.interimResults = false; // Chỉ nhận kết quả cuối cùng
        recognition.lang = document.getElementById('sourceLang').value;

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            document.getElementById('sourceText').value += transcript + ' ';
            resetSilenceTimeout(); // Reset thời gian chờ nếu có lời nói
        };

        recognition.onend = () => {
            if (isRecording) {
                recognition.start(); // Tiếp tục ghi âm nếu đang ở trạng thái ghi âm
            } else {
                updateRecordButton();
            }
        };
    }

    // Bật/tắt ghi âm
    if (!isRecording) {
        recognition.start();
        isRecording = true;
        resetSilenceTimeout(); // Bắt đầu đếm thời gian chờ
    } else {
        recognition.stop();
        isRecording = false;
        clearTimeout(silenceTimeout); // Dừng đếm thời gian chờ
    }
    
    updateRecordButton();
}

// Reset thời gian chờ nếu có lời nói
function resetSilenceTimeout() {
    clearTimeout(silenceTimeout); // Xóa timeout cũ
    silenceTimeout = setTimeout(() => {
        if (isRecording) {
            autoTranslate(); // Dịch phần đã nghe được
            recognition.stop(); // Dừng ghi âm tạm thời
        }
    }, 2000); // 2 giây không có lời nói
}

// Cập nhật giao diện nút ghi âm
function updateRecordButton() {
    const recordButton = document.querySelector('.source-box button[onclick="startSpeechRecognition()"]');
    if (isRecording) {
        recordButton.innerHTML = '⏹️';
        recordButton.style.backgroundColor = '#e74c3c';
    } else {
        recordButton.innerHTML = '🎤';
        recordButton.style.backgroundColor = '';
    }
}

// Dịch tự động khi nhập liệu
async function autoTranslate() {
    const text = document.getElementById('sourceText').value;
    const targetLang = document.getElementById('targetLang').value;
    
    if (text.length > 3) {
        const response = await fetch('/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                target_lang: targetLang
            })
        });
        
        const data = await response.json();
        document.getElementById('translatedText').value = data.translation;
    }
}

// Các chức năng khác (giữ nguyên)
function swapLanguages() {
    const source = document.getElementById('sourceLang');
    const target = document.getElementById('targetLang');
    [source.value, target.value] = [target.value, source.value];
    autoTranslate();
}

async function translateFile() {
    const fileInput = document.getElementById('fileInput');
    const targetLang = document.getElementById('targetLang').value;
    
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('target_lang', targetLang);
        
        try {
            const response = await fetch('/translate-file', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            document.getElementById('fileTranslationResult').innerHTML = 
                `<div class="result-box">${result.translation}</div>`;
        } catch (error) {
            console.error('Lỗi:', error);
        }
    }
}

function copyTranslation() {
    navigator.clipboard.writeText(document.getElementById('translatedText').value);
}

function speakTranslation() {
    const speech = new SpeechSynthesisUtterance(document.getElementById('translatedText').value);
    speech.lang = document.getElementById('targetLang').value;
    window.speechSynthesis.speak(speech);
}

function clearText() {
    document.getElementById('sourceText').value = '';
    document.getElementById('translatedText').value = '';
}

async function improveText() {
    const text = document.getElementById('editText').value;
    const response = await fetch('/improve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
    });
    
    const data = await response.json();
    document.getElementById('editedText').innerHTML = 
        `<div class="improved-text">${data.improved}</div>`;
}