document.addEventListener("DOMContentLoaded", () => {
    const cvFile = document.getElementById("cv-file");
    const chooseCvBtn = document.getElementById("choose-cv-btn");
    const uploadCvBtn = document.getElementById("upload-cv-btn");
    const removeFileBtn = document.getElementById("remove-file-btn");

    const selectedFile = document.getElementById("selected-file");
    const selectedFileName = document.getElementById("selected-file-name");
    const cvStatus = document.getElementById("cv-status");
    const uploadProgress = document.getElementById("upload-progress");

    const uploadSection = document.getElementById("cv-upload-section");
    const composerHint = document.getElementById("composer-hint");

    const messageInput = document.getElementById("message-input");
    const submitBtn = document.getElementById("submit-btn");
    const micButton = document.getElementById("mic-button");

    const interviewStatus = document.getElementById("interview-status");
    const interviewStatusDetail = document.getElementById("interview-status-detail");
    const interviewStatusIcon = document.getElementById("interview-status-icon");

    const stepUpload = document.getElementById("step-upload");
    const stepInterview = document.getElementById("step-interview");

    let selectedCv = null;
    let uploadInProgress = false;

    function setStatus(message, type = "") {
        cvStatus.textContent = message;
        cvStatus.className = "cv-status";

        if (type) {
            cvStatus.classList.add(type);
        }
    }

    function selectFile(file) {
        if (!file || uploadInProgress) {
            return;
        }

        const isPdf =
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            selectedCv = null;
            cvFile.value = "";
            selectedFile.classList.remove("visible");
            selectedFileName.textContent = "No file selected";
            uploadCvBtn.disabled = true;
            setStatus("Please select a PDF CV.", "error");
            return;
        }

        selectedCv = file;
        selectedFileName.textContent = file.name;
        selectedFile.classList.add("visible");
        uploadCvBtn.disabled = false;
        setStatus("");
    }

    function setUploading(isUploading) {
        uploadInProgress = isUploading;

        chooseCvBtn.disabled = isUploading;
        removeFileBtn.disabled = isUploading;
        uploadCvBtn.disabled = isUploading || !selectedCv;

        uploadCvBtn.textContent = isUploading
            ? "Uploading..."
            : "Upload CV";

        if (isUploading) {
            uploadProgress.classList.add("active");
        } else {
            uploadProgress.classList.remove("active");
        }
    }

    chooseCvBtn.addEventListener("click", () => {
        if (!uploadInProgress) {
            cvFile.click();
        }
    });

    cvFile.addEventListener("change", () => {
        selectFile(cvFile.files[0]);
    });

    removeFileBtn.addEventListener("click", () => {
        if (uploadInProgress) {
            return;
        }

        cvFile.value = "";
        selectedCv = null;

        selectedFile.classList.remove("visible");
        selectedFileName.textContent = "No file selected";

        uploadCvBtn.disabled = true;
        setStatus("");
    });

    uploadCvBtn.addEventListener("click", async () => {
        if (!selectedCv || uploadInProgress) {
            setStatus("Please select your CV.", "error");
            return;
        }

        // Get the interviewer ID from the hidden field in chat.html.
        const interviewerInput =
            document.getElementById("input-message");

        const interviewerId =
            interviewerInput?.value.trim();

        if (!interviewerId) {
            setStatus(
                "Missing interviewer ID. Please return to the dashboard and select an interviewer again.",
                "error"
            );
            return;
        }

        const uploadedFileName = selectedCv.name;

        const formData = new FormData();
        formData.append("cv", selectedCv);
        formData.append("interviewer_id", interviewerId);

        setUploading(true);
        setStatus("");

        try {
            const response = await fetch("/upload", {
                method: "POST",
                body: formData
            });

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    data.error || "CV upload failed."
                );
            }

            if (!data.message) {
                throw new Error(
                    "The CV was uploaded, but the opening interview message was not returned."
                );
            }

            setStatus(
                "CV uploaded successfully. Your interview is ready.",
                "success"
            );

            // Update the interview status.
            interviewStatus.textContent = "Interview ready";
            interviewStatusDetail.textContent =
                "Your CV has been processed.";
            interviewStatusIcon.textContent = "✓";
            interviewStatusIcon.className = "status-icon active";

            stepUpload.classList.remove("active");
            stepUpload.classList.add("complete");
            stepInterview.classList.add("active");

            // Keep the CV section visible so another CV can be selected later.
            if (uploadSection) {
                uploadSection.style.display = "";
            }

            // Send the opening message to chat.js for display and TTS.
            window.dispatchEvent(
                new CustomEvent("simulai:cv-ready", {
                    detail: {
                        initialMessage: data.message,
                        text: data.text || "",
                        filename: uploadedFileName
                    }
                })
            );

            // Clear the selected file so a replacement can be chosen.
            cvFile.value = "";
            selectedCv = null;
            selectedFile.classList.remove("visible");
            selectedFileName.textContent = "No file selected";

            uploadCvBtn.disabled = true;

            // chat.js activates the interview controls through the event above.
            composerHint.textContent =
                "Type your answer or use the microphone.";

        } catch (error) {
            console.error("CV upload error:", error);

            setStatus(
                error.message || "Something went wrong.",
                "error"
            );

        } finally {
            setUploading(false);
        }
    });
});