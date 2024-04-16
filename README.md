To activate the virtual environment:

```bash
source env/bin/activate # Linux; env is the name of the virtual environment
env\Scripts\activate # Windows; env is the name of the virtual environment
```

And then install the dependencies from the requirements.txt file:

```bash
pip install -r requirements.txt
```

Migrate and Make Migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

```bash
python manage.py runserver
```


followed by the ngrok command to expose the local server to the internet.


Flush DB:

```bash
python manage.py flush
```