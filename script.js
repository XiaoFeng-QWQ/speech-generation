const API_URL = 'https://api.lolimi.cn/API/yyhc/api.php';
const ModelListContent = '#ModelList';
const ShowContainer = '#ShowContainer';

/**
 * 生成消息通知
 * @param {string} message - 消息内容
 * @param {string} [type='primary'] - 消息类型（可选：'primary', 'success', 'danger'）
 */
function showToast(message, type = 'primary') {
    // 为每个 Toast 生成唯一的 ID，防止覆盖
    const toastId = `toast-${Date.now()}`;

    // 如果没有 Toast 容器，则创建一个
    if (!$('#synthToastContainer').length) {
        $('body').append(`
            <div id="synthToastContainer" class="position-fixed bottom-0 end-0 p-3" style="z-index: 11"></div>
        `);
    }

    // 创建 Toast 的 HTML 结构
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0 mb-2" role="alert"
            aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message || '处理中……'}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
                    aria-label="Close"></button>
            </div>
        </div>
    `;

    // 将新的 Toast 添加到 Toast 容器中
    $('#synthToastContainer').append(toastHTML);

    // 显示 Toast
    const toastElement = new bootstrap.Toast($(`#${toastId}`)[0]);
    toastElement.show();

    // 自动移除 Toast 元素
    $(`#${toastId}`).on('hidden.bs.toast', function () {
        $(this).remove();
    });
}

/**
 * 加载模型列表
 * 
 */
function GetModel() {
    $.ajax({
        type: "GET",
        url: API_URL,
        dataType: "JSON",
        success: function (response) {
            if (response.code === 200) {
                $(ModelListContent).html(''); // 清空列表
                // 保存模型数据以备后续搜索
                const models = response.characters;
                $.each(models, function (index, data) {
                    $(ModelListContent).append(`<li class="list-group-item model-item">${data}</li>`);
                });

                // 绑定搜索事件
                $('#ModelSearch').on('input', function () {
                    const searchText = $(this).val().toLowerCase();
                    $('#ModelList li').each(function () {
                        const modelName = $(this).text().toLowerCase();
                        $(this).toggle(modelName.includes(searchText));
                    });
                });

            } else {
                showToast('无法获取模型，请稍后重试。', 'danger');
            }
        },
        error: function () {
            showToast('网络或服务器错误，请检查连接。', 'danger');
        }
    });
}

/**
 * 播放音频
 * @param {*} url 
 */
function playAudio(url) {
    const audio = new Audio(url);
    audio.play().catch(() => { });
}

// 选择模型
$(ModelListContent).on('click', '.model-item', function () {
    const modelName = $(this).text();
    $(ShowContainer).text(`已选择：${modelName}`);
    $('.model-item').removeClass('active');  // 清除其他选项的激活状态
    $(this).addClass('active');  // 激活当前选项
});

// 合成
$('#CompleteButton').click(function () {
    const mode = $(ShowContainer).text().replace('已选择：', '').trim();
    const inputText = $('#TextInput').val();
    const autoPlay = $('#AutoPlayCheck').is(':checked');

    if (!mode || !inputText) {
        showToast('请选择模型并输入文本。', 'danger');
        return;
    }

    showToast('合成中，请稍候……');
    $(this).prop('disabled', true);

    $.ajax({
        type: "GET",
        url: `${API_URL}?msg=${encodeURIComponent(inputText)}&sp=${encodeURIComponent(mode)}`,
        dataType: "JSON",
        success: function (response) {
            if (response.code === 200) {
                showToast('合成成功！', 'success');
                $('.audio-container').removeClass('highlight');

                // 添加音频元素到页面
                const audioElement = `
                    <div class="audio-container highlight">
                        模型：${mode}：
                        <audio controls>
                            <source src="${response.mp3}" type="audio/mpeg">
                            您的浏览器不支持音频播放。
                        </audio>
                    </div>
                    <hr>`;

                $('#product').append(audioElement);
                $('#product').scrollTop($('#product')[0].scrollHeight);

                // 自动播放
                if (autoPlay) {
                    playAudio(response.mp3);
                }

            } else {
                showToast(`合成失败：${response.mp3}`, 'danger');
            }
        },
        error: function () {
            showToast('API请求失败，请稍后重试。', 'danger');
        },
        complete: function () {
            $('#CompleteButton').prop('disabled', false);
        }
    });
});

// 页面加载后获取模型数据
$(document).ready(function () {
    GetModel();
});