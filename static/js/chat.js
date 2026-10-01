document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("chat-form");
    const chatContainer = document.getElementById("chat-window");
    const messageInput = document.getElementById("message-input");
    const submitBtn = document.getElementById("submit-btn");
    const micButton = document.getElementById("mic-button");

    const questionNumber = document.getElementById("question-number");
    const composerHint = document.getElementById("composer-hint");

    const interviewStatus =
        document.getElementById("interview-status");

    const interviewStatusDetail =
        document.getElementById("interview-status-detail");

    const interviewStatusIcon =
        document.getElementById("interview-status-icon");

    const stepInterview =
        document.getElementById("step-interview");

    const stepResult =
        document.getElementById("step-result");

    // CV upload section is located in the right sidebar.
    const cvUploadSection =
        document.getElementById("cv-upload-section");

    let isListening = false;
    let isInterviewActive = false;
    let questionCount = 0;


    // ------------------------------------------------------------
    // Speech synthesis
    // ------------------------------------------------------------

    let voices = window.speechSynthesis
        ? window.speechSynthesis.getVoices()
        : [];


    if (window.speechSynthesis) {

        window.speechSynthesis.onvoiceschanged = () => {

            voices =
                window.speechSynthesis.getVoices();

        };

    }


    // ------------------------------------------------------------
    // Text-to-speech helper
    // ------------------------------------------------------------

    function speakAiResponse(
        text,
        startListening = true
    ) {

        if (
            !text ||
            !window.speechSynthesis
        ) {

            return;

        }


        console.log("Starting TTS.");

        // Stop anything that may already be speaking.
        window.speechSynthesis.cancel();


        const speech =
            new SpeechSynthesisUtterance(text);


        if (voices.length > 0) {

            speech.voice =
                voices[0];

        }


        speech.onstart = () => {

            console.log("TTS started.");

        };


        speech.onend = () => {

            console.log("TTS finished.");


            if (
                startListening &&
                recognition &&
                isInterviewActive
            ) {

                console.log(
                    "Trying to automatically start STT..."
                );


                try {

                    recognition.start();

                } catch (error) {

                    console.warn(
                        "Automatic STT could not start:",
                        error
                    );

                }

            }

        };


        speech.onerror = (error) => {

            console.warn(
                "TTS error:",
                error
            );

        };


        window.speechSynthesis.speak(
            speech
        );

    }


    // ------------------------------------------------------------
    // History
    // ------------------------------------------------------------

    function renderPastMessages() {

        const historyElement =
            document.getElementById(
                "chat-history-data"
            );


        if (!historyElement) {

            return;

        }


        try {

            const history =
                JSON.parse(
                    historyElement.textContent || "[]"
                );


            history.forEach(entry => {

                const role =
                    Array.isArray(entry)
                        ? entry[0]
                        : entry.role;


                const content =
                    Array.isArray(entry)
                        ? entry[1]
                        : entry.content;


                if (
                    role === "user" ||
                    role === "model"
                ) {

                    appendSimulAiMessage(
                        role,
                        content,
                        false
                    );

                }

            });

        } catch (error) {

            console.error(
                "Failed to parse chat history JSON:",
                error
            );

        }

    }


    // ------------------------------------------------------------
    // Messages
    // ------------------------------------------------------------

    function appendSimulAiMessage(
        role,
        text,
        animate = true
    ) {

        const wrapper =
            document.createElement("div");


        wrapper.className =
            role === "user"
                ? "chat-message user-message-wrap"
                : "chat-message";


        if (!animate) {

            wrapper.style.animation =
                "none";

        }


        // -------------------------
        // User message
        // -------------------------

        if (role === "user") {

            const column =
                document.createElement("div");


            column.className =
                "user-message-column";


            const meta =
                document.createElement("div");


            meta.className =
                "user-meta";


            meta.textContent =
                "You";


            const bubble =
                document.createElement("div");


            bubble.className =
                "user-message";


            bubble.textContent =
                text;


            column.appendChild(meta);
            column.appendChild(bubble);

            wrapper.appendChild(column);

        }


        // -------------------------
        // AI message
        // -------------------------

        else {

            const avatar =
                document.createElement("div");


            avatar.className =
                "ai-avatar";


            avatar.innerHTML =
                "<span>AI</span>";


            const column =
                document.createElement("div");


            column.className =
                "message-column";


            const meta =
                document.createElement("div");


            meta.className =
                "message-meta";


            meta.textContent =
                "AI Interviewer";


            const bubble =
                document.createElement("div");


            bubble.className =
                "ai-message";


            bubble.textContent =
                text;


            column.appendChild(meta);
            column.appendChild(bubble);

            wrapper.appendChild(avatar);
            wrapper.appendChild(column);

        }


        chatContainer.appendChild(
            wrapper
        );


        chatContainer.scrollTop =
            chatContainer.scrollHeight;


        return wrapper.querySelector(
            ".ai-message, .user-message"
        );

    }


    window.appendSimulAiMessage =
        appendSimulAiMessage;


    // ------------------------------------------------------------
    // Typing indicator
    // ------------------------------------------------------------

    function appendTypingIndicator() {

        const wrapper =
            document.createElement("div");


        wrapper.className =
            "chat-message";


        wrapper.id =
            "typing-message";


        const avatar =
            document.createElement("div");


        avatar.className =
            "ai-avatar";


        avatar.innerHTML =
            "<span>AI</span>";


        const column =
            document.createElement("div");


        column.className =
            "message-column";


        const meta =
            document.createElement("div");


        meta.className =
            "message-meta";


        meta.textContent =
            "AI Interviewer";


        const indicator =
            document.createElement("div");


        indicator.className =
            "ai-message";


        indicator.innerHTML = `
            <span class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </span>
        `;


        column.appendChild(meta);
        column.appendChild(indicator);

        wrapper.appendChild(avatar);
        wrapper.appendChild(column);

        chatContainer.appendChild(wrapper);


        chatContainer.scrollTop =
            chatContainer.scrollHeight;

    }


    function removeTypingIndicator() {

        document
            .getElementById("typing-message")
            ?.remove();

    }


    function sleep(ms) {

        return new Promise(
            resolve =>
                setTimeout(resolve, ms)
        );

    }


    // ------------------------------------------------------------
    // Interview state
    // ------------------------------------------------------------

    function setInterviewActive(active) {

        isInterviewActive =
            active;


        messageInput.disabled =
            !active;


        submitBtn.disabled =
            !active;


        micButton.disabled =
            !active;


        if (active) {

            stepInterview.classList.add(
                "active"
            );


            interviewStatus.textContent =
                "Interview in progress";


            interviewStatusDetail.textContent =
                "Answer the AI interviewer.";


            interviewStatusIcon.textContent =
                "●";


            interviewStatusIcon.className =
                "status-icon active";


            composerHint.textContent =
                "Type your answer or use the microphone.";

        }

    }


    function incrementQuestion() {

        questionCount += 1;


        questionNumber.textContent =
            String(questionCount)
                .padStart(2, "0");

    }


    // ------------------------------------------------------------
    // CV uploaded
    // ------------------------------------------------------------

    /*
     * CV upload completion means the UI is ready
     * for the interview.
     *
     * The CV uploader intentionally remains visible
     * so the user can replace their CV later.
     *
     * Flask/backend provides the first interviewer message.
     */

    window.addEventListener(
        "simulai:cv-ready",
        async (event) => {

            // Keep the CV uploader visible.
            if (cvUploadSection) {

                cvUploadSection.style.display =
                    "";

            }


            // Enable interview controls.
            setInterviewActive(true);


            /*
             * Flask/backend provides the opening message.
             */

            if (
                event.detail?.initialMessage
            ) {

                const openingMessage =
                    event.detail.initialMessage;


                // Display opening message.
                appendSimulAiMessage(
                    "model",
                    openingMessage
                );


                // Speak opening message.
                speakAiResponse(
                    openingMessage,
                    true
                );

            }

        }
    );


    // ------------------------------------------------------------
    // Voice input
    // ------------------------------------------------------------

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    let recognition = null;


    if (SpeechRecognition) {

        recognition =
            new SpeechRecognition();


        recognition.interimResults =
            true;


        recognition.continuous =
            true;


        // --------------------------------------------------------
        // Recognition started
        // --------------------------------------------------------

        recognition.addEventListener(
            "start",
            () => {

                console.log(
                    "Speech recognition started."
                );


                isListening =
                    true;


                micButton.classList.add(
                    "listening"
                );


                micButton.setAttribute(
                    "aria-label",
                    "Stop voice input"
                );


                micButton.title =
                    "Stop voice input";


                submitBtn.classList.add(
                    "listening"
                );


                submitBtn
                    .querySelector(".send-text")
                    .textContent =
                    "Stop & Send";

            }
        );


        // --------------------------------------------------------
        // Recognition ended
        // --------------------------------------------------------

        recognition.addEventListener(
            "end",
            () => {

                console.log(
                    "Speech recognition ended."
                );


                isListening =
                    false;


                micButton.classList.remove(
                    "listening"
                );


                micButton.setAttribute(
                    "aria-label",
                    "Start voice input"
                );


                micButton.title =
                    "Start voice input";


                submitBtn.classList.remove(
                    "listening"
                );


                submitBtn
                    .querySelector(".send-text")
                    .textContent =
                    "Send";

            }
        );


        // --------------------------------------------------------
        // Recognition error
        // --------------------------------------------------------

        recognition.addEventListener(
            "error",
            error => {

                console.warn(
                    "Speech recognition error:",
                    error.error
                );

            }
        );


        // --------------------------------------------------------
        // Recognition result
        // --------------------------------------------------------

        recognition.addEventListener(
            "result",
            event => {

                const transcript =
                    Array.from(
                        event.results
                    )
                        .map(
                            result =>
                                result[0]
                                    .transcript
                        )
                        .join("");


                messageInput.value =
                    transcript;


                messageInput.dispatchEvent(
                    new Event("input")
                );

            }
        );


    } else {

        micButton.title =
            "Voice input is not supported by this browser";


        micButton.disabled =
            true;

    }


    // ------------------------------------------------------------
    // Microphone button
    // ------------------------------------------------------------

    micButton.addEventListener(
        "click",
        () => {

            console.log(
                "Microphone button clicked."
            );


            if (!recognition) {

                console.warn(
                    "Speech recognition is not available."
                );


                return;

            }


            if (isListening) {

                recognition.stop();

            } else {

                try {

                    recognition.start();

                } catch (error) {

                    console.warn(
                        "Recognition could not start:",
                        error
                    );

                }

            }

        }
    );


    // ------------------------------------------------------------
    // Auto-grow textarea
    // ------------------------------------------------------------

    messageInput.addEventListener(
        "input",
        () => {

            messageInput.style.height =
                "auto";


            messageInput.style.height =
                Math.min(
                    messageInput.scrollHeight,
                    100
                ) + "px";

        }
    );


    // ------------------------------------------------------------
    // Send / streaming
    // ------------------------------------------------------------

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!isInterviewActive) {

                return;

            }


            // Stop speech recognition before sending.
            if (
                isListening &&
                recognition
            ) {

                recognition.stop();

            }


            const messageText =
                messageInput.value.trim();


            if (!messageText) {

                return;

            }


            const interviewerID =
                document
                    .getElementById(
                        "input-message"
                    )
                    .value;


            // Show user message immediately.
            appendSimulAiMessage(
                "user",
                messageText
            );


            messageInput.value =
                "";


            messageInput.style.height =
                "auto";


            submitBtn.disabled =
                true;


            micButton.disabled =
                true;


            appendTypingIndicator();


            try {

                const response =
                    await fetch(
                        "/send",
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    interviewer_id:
                                        interviewerID,

                                    user_input:
                                        messageText
                                })
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        `Server returned ${response.status}`
                    );

                }


                removeTypingIndicator();


                const bubble =
                    appendSimulAiMessage(
                        "model",
                        ""
                    );


                let fullResponse =
                    "";


                // ------------------------------------------------
                // Non-streaming fallback
                // ------------------------------------------------

                if (!response.body) {

                    const text =
                        await response.text();


                    bubble.textContent =
                        text;


                    fullResponse =
                        text;

                }


                // ------------------------------------------------
                // Streaming response
                // ------------------------------------------------

                else {

                    const reader =
                        response.body
                            .getReader();


                    const decoder =
                        new TextDecoder();


                    while (true) {

                        const {
                            done,
                            value
                        } =
                            await reader.read();


                        if (done) {

                            break;

                        }


                        const chunkText =
                            decoder.decode(
                                value,
                                {
                                    stream:
                                        true
                                }
                            );


                        fullResponse +=
                            chunkText;


                        // Preserve the character-by-character
                        // streaming effect.
                        for (
                            const character
                            of chunkText
                        ) {

                            bubble.textContent +=
                                character;


                            await sleep(12);


                            chatContainer.scrollTop =
                                chatContainer.scrollHeight;

                        }

                    }


                    fullResponse +=
                        decoder.decode();

                }


                incrementQuestion();


                // ------------------------------------------------
                // Text-to-speech
                // ------------------------------------------------

                if (fullResponse) {

                    speakAiResponse(
                        fullResponse,
                        true
                    );

                }


            } catch (error) {

                removeTypingIndicator();


                appendSimulAiMessage(
                    "model",
                    "I couldn't process that response. Please try again."
                );


                console.error(
                    "Interview request error:",
                    error
                );

            } finally {

                submitBtn.disabled =
                    !isInterviewActive;


                micButton.disabled =
                    !recognition ||
                    !isInterviewActive;

            }

        }
    );


    // ------------------------------------------------------------
    // Interview result
    // ------------------------------------------------------------

    /*
     * Flask/backend can call:
     *
     * window.showInterviewResult(result)
     *
     * after the evaluation is complete.
     */

    window.showInterviewResult =
        function(result = {}) {


            // Stop voice recognition.
            if (
                recognition &&
                isListening
            ) {

                recognition.stop();

            }


            // Stop TTS.
            if (
                window.speechSynthesis
            ) {

                window.speechSynthesis.cancel();

            }


            isInterviewActive =
                false;


            messageInput.disabled =
                true;


            submitBtn.disabled =
                true;


            micButton.disabled =
                true;


            // Update interview status.
            interviewStatus.textContent =
                "Interview complete";


            interviewStatusDetail.textContent =
                "Your evaluation is ready.";


            interviewStatusIcon.textContent =
                "✓";


            interviewStatusIcon.className =
                "status-icon complete";


            stepInterview.classList.remove(
                "active"
            );


            stepInterview.classList.add(
                "complete"
            );


            stepResult.classList.add(
                "active"
            );


            composerHint.textContent =
                "Interview complete. Review your result below.";


            // ----------------------------------------------------
            // Result card
            // ----------------------------------------------------

            const card =
                document.createElement("div");


            card.className =
                "result-card";


            const score =
                result.score ?? "—";


            const technical =
                result.technical ?? "—";


            const domainKnowledge =
                result.domain_knowledge ?? "—";


            const problemSolving =
                result.problem_solving ?? "—";


            const feedback =
                result.feedback ??
                "Your detailed evaluation is ready.";


            card.innerHTML = `

                <div class="result-kicker">
                    ✦ INTERVIEW COMPLETE ✦
                </div>

                <h2>
                    ${escapeHtml(
                        result.title ||
                        "Interview Evaluation"
                    )}
                </h2>

                <div class="result-score">

                    ${escapeHtml(
                        String(score)
                    )}

                    <span style="font-size:18px">
                        /100
                    </span>

                </div>

                <div class="result-divider"></div>

                <div class="result-grid">

                    <div class="result-stat">

                        <strong>
                            ${escapeHtml(
                                String(technical)
                            )}
                        </strong>

                        <span>
                            Technical
                        </span>

                    </div>


                    <div class="result-stat">

                        <strong>
                            ${escapeHtml(
                                String(domainKnowledge)
                            )}
                        </strong>

                        <span>
                            Domain Knowledge
                        </span>

                    </div>


                    <div class="result-stat">

                        <strong>
                            ${escapeHtml(
                                String(problemSolving)
                            )}
                        </strong>

                        <span>
                            Problem Solving
                        </span>

                    </div>

                </div>


                <p class="result-text">

                    ${escapeHtml(
                        String(feedback)
                    )}

                </p>


                <button
                    type="button"
                    class="end-interview-button"
                >
                    Interview Completed
                </button>

            `;


            chatContainer.appendChild(
                card
            );


            chatContainer.scrollTop =
                chatContainer.scrollHeight;

        };


    // ------------------------------------------------------------
    // HTML escaping
    // ------------------------------------------------------------

    function escapeHtml(value) {

        return String(value)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    // ------------------------------------------------------------
    // Load previous history
    // ------------------------------------------------------------

    renderPastMessages();

});