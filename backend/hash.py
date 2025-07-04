import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

if __name__ == "__main__":
    password = input("Enter password to hash: ")
    hashed_password = hash_password(password)
    print("Hashed password:")
    print(hashed_password)
