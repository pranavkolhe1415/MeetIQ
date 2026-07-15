/**
 * ==========================================================
 * MeetIQ API Service
 * ==========================================================
 */

class API {

    constructor() {

        this.baseURL = "http://localhost:3000/api";

        this.token =
            localStorage.getItem("meetiq_token") || "";

    }
    getDashboard() {

    return this.request("/meetings");

}

    setToken(token) {

        this.token = token;

        if (token) {

            localStorage.setItem(
                "meetiq_token",
                token
            );

        } else {

            localStorage.removeItem(
                "meetiq_token"
            );

        }

    }

    getToken() {

        return this.token;

    }

    async request(url, options = {}) {

        const headers = {

            ...(options.headers || {})

        };

        if (!(options.body instanceof FormData)) {

            headers["Content-Type"] =
                "application/json";

        }

        if (this.token) {

            headers.Authorization =
                `Bearer ${this.token}`;

        }

        const response = await fetch(

            this.baseURL + url,

            {

                ...options,

                headers

            }

        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(

                data.message ||

                "Request Failed"

            );

        }

        return data;

    }

    /* ==============================
       AUTH
    ============================== */

    signup(body) {

        return this.request(

            "/auth/signup",

            {

                method: "POST",

                body: JSON.stringify(body)

            }

        );

    }

    login(body) {

        return this.request(

            "/auth/login",

            {

                method: "POST",

                body: JSON.stringify(body)

            }

        );

    }

    getProfile() {

        return this.request(

            "/auth/profile"

        );

    }
uploadFile(file, title, onProgress) {

    return new Promise((resolve, reject) => {

        const formData = new FormData();

        formData.append("meeting", file);

        formData.append("title", title);

        const xhr = new XMLHttpRequest();

        xhr.open(
            "POST",
            this.baseURL + "/meetings/upload"
        );

        const token = localStorage.getItem("meetiq_token");

        if (token) {

            xhr.setRequestHeader(
                "Authorization",
                `Bearer ${token}`
            );

        }

        xhr.upload.onprogress = (e) => {

            if (e.lengthComputable && onProgress) {

                onProgress(
                    Math.round((e.loaded / e.total) * 100)
                );

            }

        };

        xhr.onload = () => {

            try {

                const response = JSON.parse(xhr.responseText);

                if (xhr.status >= 200 && xhr.status < 300) {

                    resolve(response);

                } else {

                    reject(new Error(response.message || "Upload failed"));

                }

            } catch {

                reject(new Error("Invalid server response"));

            }

        };

        xhr.onerror = () => {

            reject(new Error("Upload failed"));

        };

        xhr.send(formData);

    });

}
    /* ==============================
       MEETINGS
    ============================== */

    uploadMeeting(file, title) {

        const form = new FormData();

        form.append("meeting", file);

        form.append(

            "title",

            title

        );

        return this.request(

            "/meetings/upload",

            {

                method: "POST",

                body: form

            }

        );

    }

    analyzeMeeting(id) {

    return this.request(

        `/meetings/${id}/process`,

        {

            method:"POST"

        }

    );

}

    // getProgress(id) {

    //     return this.request(

    //         `/meetings/${id}/progress`

    //     );

    // }

    getMeetings() {

        return this.request(

            "/meetings"

        );

    }

    getMeeting(id) {

        return this.request(

            `/meetings/${id}`

        );

    }

    deleteMeeting(id) {

        return this.request(

            `/meetings/${id}`,

            {

                method: "DELETE"

            }

        );

    }

    downloadPDF(id) {

        window.open(

            `${this.baseURL}/meetings/${id}/pdf`,

            "_blank"

        );

    }

    /* ==============================
       CHAT
    ============================== */

    askAI(id, message) {

        return this.request(

            `/chat/${id}`,

            {

                method: "POST",

                body: JSON.stringify({

                    message

                })

            }

        );

    }

    getSummary(id) {

        return this.request(

            `/chat/${id}/summary`

        );

    }

    getSuggestions(id) {

        return this.request(

            `/chat/${id}/suggestions`

        );

    }

}

const api = new API();