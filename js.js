$(document).ready(function () {
    const BASE_URL = 'https://polisenceai-ramg.run.goorm.site'; // Base API URL

    // Load FM models and builds
    function loadModels() {
        showLoadingMessage('#fm-select', 'Loading models...');
        showLoadingMessage('#build-select', 'Loading builds...');
        $.ajax({
            url: `${BASE_URL}/list_models`,
            type: 'GET',
            success: function (response) {
                if (response.available_models && Object.keys(response.available_models).length > 0) {
                    populateModelDropdowns(response.available_models);
                } else {
                    console.warn("No models available.");
                    displayErrorMessage('#fm-select', 'No models available.');
                }
            },
            error: function (xhr) {
                console.error("Error fetching models:", xhr);
                displayErrorMessage('#fm-select', 'Failed to load models.');
                displayErrorMessage('#build-select', 'Failed to load builds.');
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
        if (sortedModels.length === 0) {
            displayErrorMessage('#fm-select', 'No models available.');
            return;
        }

        sortedModels.forEach((model, index) => {
            fmSelect.append(new Option(model, model));
            if (index === 0) populateBuildDropdown(models[model]); // Populate builds for the first FM model
        });

        // Ensure the dropdown works correctly
        fmSelect.off('change').on('change', function () {
            const selectedModel = $(this).val();
            populateBuildDropdown(models[selectedModel]);
        });
    }

    function populateBuildDropdown(builds) {
        const buildSelect = $('#build-select');
        buildSelect.empty();

        if (!builds || builds.length === 0) {
            displayErrorMessage('#build-select', 'No builds available.');
            return;
        }

        builds.sort().forEach(build => {
            buildSelect.append(new Option(build, build));
        });
    }

    function sendMessage() {
        let query = $('#user-input').val().trim();
        const fmModel = $('#fm-select').val();
        const buildName = $('#build-select').val();

        if (!query) {
            alert('Please enter a message.');
            return;
        }

        appendMessage('user', query);
        $('#user-input').val('');

        appendMessage('bot', 'Processing your request...');

        $.ajax({
            url: `${BASE_URL}/predict`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ query, model_name: fmModel, build_name: buildName }),
            success: function (response) {
                appendMessage('bot', processResponse(response));
            },
            error: function (xhr) {
                console.error("Error sending message:", xhr);
                appendMessage('bot', `Error: ${xhr.responseText || "No response from server."}`);
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

    function showLoadingMessage(selector, message) {
        $(selector).empty().append(new Option(message, '', true, true));
    }

    function displayErrorMessage(selector, message) {
        $(selector).empty().append(new Option(message, '', true, true));
    }

    // Attach event listeners
    $('#send-button').on('click', sendMessage);

    $('#user-input').on('keypress', function (e) {
        if (e.which === 13) sendMessage();
    });

    // Load models on page load
    loadModels();
});
