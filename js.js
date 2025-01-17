$(document).ready(function () {
    const BASE_URL = 'https://polisenceai-ramg.run.goorm.site'; // Base API URL

    // Load FM models and builds
    function loadModels() {
        $.ajax({
            url: `${BASE_URL}/list_models`,
            type: 'GET',
            success: function (response) {
                populateModelDropdowns(response.available_models);
            },
            error: function (xhr) {
                console.error("Error fetching models:", xhr);
            }
        });
    }

    function populateModelDropdowns(models) {
        const fmSelect = $('#fm-select');
        const buildSelect = $('#build-select');

        fmSelect.empty();
        buildSelect.empty();

        // Populate FM models dropdown
        const sortedModels = Object.keys(models).sort();
        sortedModels.forEach((model, index) => {
            fmSelect.append(new Option(model, model));
            if (index === 0) populateBuildDropdown(models[model]); // Populate builds for the first FM model
        });

        // Update builds when a model is selected
        fmSelect.on('change', function () {
            const selectedModel = $(this).val();
            populateBuildDropdown(models[selectedModel]);
        });
    }

    function populateBuildDropdown(builds) {
        const buildSelect = $('#build-select');
        buildSelect.empty();

        builds.sort().forEach((build, index) => {
            buildSelect.append(new Option(build, build));
        });
    }

    $('#send-button').on('click', function () {
        sendMessage();
    });

    $('#user-input').on('keypress', function (e) {
        if (e.which === 13) {
            sendMessage();
        }
    });

    function sendMessage() {
        let query = $('#user-input').val().trim();
        const fmModel = $('#fm-select').val();
        const buildName = $('#build-select').val();

        if (query === '') return;

        appendMessage('user', query);

        $('#user-input').val('');

        $.ajax({
            url: `${BASE_URL}/predict`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ query, model_name: fmModel, build_name: buildName }),
            success: function (response) {
                appendMessage('bot', processResponse(response));
            },
            error: function (xhr) {
                appendMessage('bot', `Error: ${xhr.responseText || "No response"}`);
            }
        });
    }

    function appendMessage(sender, message) {
        let messageElement = $('<div>', { class: `chat-message ${sender}` });
        let messageContent = $('<div>', { class: 'message-content' }).html(message);
        messageElement.append(messageContent);
        $('#chat-history').append(messageElement);
        $('#chat-history').scrollTop($('#chat-history')[0].scrollHeight);
    }

    function processResponse(response) {
        if (response.predicted_intents && response.predicted_intents.length > 0) {
            let predictionsHTML = '<strong>Predictions:</strong><ul>';
            response.predicted_intents.forEach(prediction => {
                predictionsHTML += `
                    <li>
                        <strong>Intent:</strong> ${prediction.intent}<br>
                        <strong>Confidence:</strong> ${(prediction.confidence * 100).toFixed(2)}%
                    </li>`;
            });
            predictionsHTML += '</ul>';
            return predictionsHTML;
        } else {
            return 'No predictions found.';
        }
    }

    // Load models on page load
    loadModels();
});
