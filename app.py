from flask import Flask,render_template,redirect,session,jsonify,Response,url_for,request,flash
import database as db
import engine as ai
import pymupdf as py
import os
UPLOAD_FOLDER="uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app=Flask(__name__)
app.secret_key=os.environ.get("SECRET_KEY")

db.init_db()

@app.route("/")
def home():
    return redirect(url_for("login"))


@app.route("/login", methods=["GET","POST"])
def login():
    if request.method=="GET":
        return render_template("login.html")
    else:
        user_nm=request.form.get("username", "").strip()
        user_pwd=request.form.get("password", "").strip()

        action=request.form.get("action")

        if action=="register":
            user_reg=db.register_user(user_nm,user_pwd)

            if user_reg==True:
                session["username"]=user_nm
                flash("Registration succesfull! Welcome to SimulAI.")
                return redirect(url_for("dashboard"))

            else:
                return render_template("login.html", message="Username already taken!")


        if action=="login":
            user_log=db.verify_user(user_nm,user_pwd)

            if user_log==True:
                session["username"]=user_nm
                flash("Login Successfull!")
                return redirect(url_for("dashboard"))

            else:
                return render_template("login.html", message="Invalid Credentials!")

@app.route("/dashboard")
def dashboard():
    if "username" not in session:
        return redirect(url_for("login"))
    else:
        return render_template("dashboard.html",username=session["username"])
        

@app.route("/interview/<interviewer_id>")
def interviewer(interviewer_id):
    if "username" not in session:
        return redirect(url_for("login")) 

    user_nm=session["username"]
    db.ensure_session(user_nm,interviewer_id)
    history=db.full_history(user_nm,interviewer_id)

    if not history:
        greetings={
            "it":"Hello, Please upload your cv to begin the interview.",
            "finance":"Hello, Please upload your cv to begin the interview.",
            "marketing":"Hello, Please upload your cv to begin the interview.",
            "management":"Hello, Please upload your cv to begin the interview."
        }
        initial_greetings=greetings.get(interviewer_id)
        db.save_message(user_nm,interviewer_id,"model",initial_greetings)
        history=db.full_history(user_nm,interviewer_id)

    return render_template("chat.html", chat_history=history, session_id=user_nm,current_interviewer=interviewer_id)

@app.route("/upload", methods=["POST"])
def upload_cv():
    
    if "username" not in session:
        return redirect(url_for("login"))

    user_nm=session["username"]
        
    if "cv" not in request.files:
        return jsonify({"error": "No file uploaded"}),400

    file=request.files["cv"]

    if file.filename=="":
        return jsonify({"error": "No file selected"}),400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only pdf files are supported"}),400

    interviewer_id=request.form.get("interviewer_id")

    if not interviewer_id:
        return jsonify({"error": "Missing Interviewer_id"}),400

    save_path=os.path.join(
        UPLOAD_FOLDER,
        f"{user_nm}_{file.filename}"   
    )

    file.save(save_path)

    pdf=py.open(save_path)
    extracted_text=""

    for txt in pdf:
        extracted_text+=txt.get_text("text", sort=True)
        extracted_text += "\n"

    pdf.close()

    db.save_resume(
        user_nm,
        save_path,
        extracted_text
    )

    opening_res=[]

    for chunks in ai.ai_open_res(
        user_nm,
        interviewer_id
    ):
        opening_res.append(chunks)

    opening_msg="".join(opening_res)

    db.save_message(
        user_nm,
        interviewer_id,
        "model",
        opening_msg
    )

    return jsonify({
        "message": opening_msg
    })
@app.route("/send", methods=["POST"])
def send():
    if "username" not in session:
        return redirect(url_for("login"))

    user_nm=session["username"]

    data=request.get_json()
    interviewer_id=data.get("interviewer_id")
    user_input=data.get("user_input")

    if user_input and interviewer_id:
        db.save_message(user_nm,interviewer_id,"user",user_input)

        ai.update_memory_ai(user_nm,interviewer_id)

        def generator():
            full_msg=[]
            for chunks in ai.get_interviewer_res(user_nm,interviewer_id):
                full_msg.append(chunks)
                yield chunks

            complete_txt="".join(full_msg)
            db.save_message(user_nm,interviewer_id,"model",complete_txt)
        return Response(generator(), mimetype="text/plain")
    return jsonify({"error": "Invalid request"}),400

@app.route("/logout")
def logout():
    session.pop("username",None)

    return redirect(url_for("login"))
if __name__=="__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


