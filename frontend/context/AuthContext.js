"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, tokens, activeSchool, activeTeacher, activeStudent } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [activeSchoolId, setActiveSchoolId] = useState(null);
  const [activeTeacherId, setActiveTeacherId] = useState(null);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  function loadSchool() {
    return api
      .get("/school/")
      .then(setSchool)
      .catch(() => setSchool(null));
  }

  useEffect(() => {
    let currentActive = activeSchool.get();
    setActiveSchoolId(currentActive);
    
    let currentTeacher = activeTeacher.get();
    setActiveTeacherId(currentTeacher);

    let currentStudent = activeStudent.get();
    setActiveStudentId(currentStudent);

    if (tokens.access) {
      api
        .get("/auth/me/")
        .then(async (u) => {
          setUser(u);
          if (u.is_super_admin && !currentActive) {
            try {
              const schools = await api.get("/platform/schools/");
              const schoolList = schools.results || schools;
              if (schoolList && schoolList.length > 0) {
                currentActive = schoolList[0].id;
                activeSchool.set(currentActive);
                setActiveSchoolId(String(currentActive));
              }
            } catch (e) {}
          }
          if (!u.is_super_admin || currentActive) {
            await loadSchool();
          }
        })
        .catch((err) => {
          console.error("Auth fetch error:", err);
          if (err?.status === 401) {
            tokens.clear();
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username, password) {
    const data = await api.post("/auth/login/", { username, password }, { auth: false });
    tokens.set({ access: data.access, refresh: data.refresh });
    setUser(data.user);
    
    if (!data.user.is_super_admin) {
      await loadSchool();
    } else {
      try {
        const schools = await api.get("/platform/schools/");
        const schoolList = schools.results || schools;
        if (schoolList && schoolList.length > 0) {
          activeSchool.set(schoolList[0].id);
          setActiveSchoolId(String(schoolList[0].id));
          await loadSchool();
        }
      } catch (e) {}
    }
    return data.user;
  }

  async function enterSchool(id) {
    activeSchool.set(id);
    setActiveSchoolId(String(id));
    await loadSchool();
  }

  function exitSchool() {
    activeSchool.clear();
    setActiveSchoolId(null);
    setSchool(null);
    exitTeacher();
    exitStudent();
  }

  function enterTeacher(id) {
    activeTeacher.set(id);
    setActiveTeacherId(String(id));
    // Clear student if switching
    exitStudent();
  }

  function exitTeacher() {
    activeTeacher.clear();
    setActiveTeacherId(null);
  }

  function enterStudent(id) {
    activeStudent.set(id);
    setActiveStudentId(String(id));
    // Clear teacher if switching
    exitTeacher();
  }

  function exitStudent() {
    activeStudent.clear();
    setActiveStudentId(null);
  }

  function logout() {
    tokens.clear();
    activeSchool.clear();
    activeTeacher.clear();
    activeStudent.clear();
    setUser(null);
    setSchool(null);
    setActiveSchoolId(null);
    setActiveTeacherId(null);
    setActiveStudentId(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{
        user, school, activeSchoolId, activeTeacherId, activeStudentId, loading,
        login, logout, enterSchool, exitSchool, enterTeacher, exitTeacher, enterStudent, exitStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
