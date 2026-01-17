import { useParams } from "buncf/router";
import { useEffect, useState } from "react";
import { api } from "../../../.buncf/api-client";

export default function UserPage() {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);

  console.log(id);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await api.get("/api/users/:id", { params: { id: id! } });
      setUser(user);
    };
    fetchUser();
  }, [id]);

    return (
        <div>
          {user ? (
            <div>
              <h1>User Profile</h1>
              <p>Name: {user.name}</p>
              <p>Email: {user.email}</p>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
    );
}