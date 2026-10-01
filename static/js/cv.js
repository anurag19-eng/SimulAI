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

    function setStatus(message, type = "") {
        cvStatus.textContent = message;
        cvStatus.className = "cv-status";
        if (type) cvStatus.classList.add(type);
    }

    function selectFile(file) {
        if (!file) return;

        const isPdf =
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            selectedCv = null;
            selectedFile.classList.remove("visible");
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

    chooseCvBtn.addEventListener("click", () => cvFile.click());

    cvFile.addEventListener("change", () => {
        selectFile(cvFile.files[0]);
    });

    removeFileBtn.addEventListener("click", () => {
        cvFile.value = "";
        selectedCv = null;
        selectedFile.classList.remove("visible");
        selectedFileName.textContent = "No file selected";
        uploadCvBtn.disabled = true;
        setStatus("");
    });

    uploadCvBtn.addEventListener("click", async () => {
        if (!selectedCv) {
            setStatus("Please select your CV.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("cv", selectedCv);

        uploadCvBtn.disabled = true;
        chooseCvBtn.disabled = true;
        removeFileBtn.disabled = true;
        uploadCvBtn.textContent = "Uploading...";
        uploadProgress.classList.add("active");
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
                throw new Error(data.error || "CV upload failed.");
            }

            console.log("Extracted CV text:", data.text);

            setStatus("CV uploaded and analyzed successfully.", "success");
            interviewStatus.textContent = "Interview ready";
            interviewStatusDetail.textContent = "Your CV has been analyzed.";
            interviewStatusIcon.textContent = "✓";
            interviewStatusIcon.className = "status-icon active";

            stepUpload.classList.remove("active");
            stepUpload.classList.add("complete");
            stepInterview.classList.add("active");

            // Hide the upload interface after successful processing.
            uploadSection.style.display = "none";

            messageInput.disabled = false;
            submitBtn.disabled = false;
            micButton.disabled = false;
            composerHint.textContent = "You can type your answer or use the microphone.";

            // Let the chat page know the CV is ready.
            window.dispatchEvent(new CustomEvent("simulai:cv-ready", {
                detail: {
                    text: data.text || "",
                    filename: selectedCv.name
                }
            }));

            // If the backend returns an initial interviewer message, display it.
            if (data.message && typeof window.appendSimulAiMessage === "function") {
                window.appendSimulAiMessage("model", data.message);
            }

        } catch (error) {
            console.error("CV upload error:", error);
            setStatus(error.message || "Something went wrong.", "error");

            uploadCvBtn.disabled = false;
            chooseCvBtn.disabled = false;
            removeFileBtn.disabled = false;
        } finally {
            uploadProgress.classList.remove("active");
            uploadCvBtn.textContent = "Upload CV";
        }
    });
});
