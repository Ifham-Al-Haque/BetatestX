import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Textarea from "../components/ui/textarea";
import Label from "../components/ui/label";
import  Avatar  from "react-avatar";

export default function EmployeeForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    department: "",
    position: "",
    employee_id: "",
    reporting_manager: "",
    role: "",
    scopes: "",
    responsibilities: "",
    profile_pic_url: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch employee data for editing
  useEffect(() => {
    async function fetchEmployee() {
      if (id) {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          setError("Failed to load employee data.");
          return;
        }

        if (data) {
          setFormData(data);
        }
      }
    }

    fetchEmployee();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Check for duplicates if not editing
      if (!id) {
        const { data: existing, error: checkError } = await supabase
          .from("employees")
          .select("id")
          .or(`email.eq.${formData.email},employee_id.eq.${formData.employee_id}`);

        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
          setError("Employee with this email or employee ID already exists.");
          return;
        }
      }

      let response;
      if (id) {
        // Update
        response = await supabase
          .from("employees")
          .update(formData)
          .eq("id", id)
          .select()
          .single();
      } else {
        // Insert
        response = await supabase
          .from("employees")
          .insert([formData])
          .select()
          .single();
      }

      if (response.error) throw response.error;

      if (!response.data) {
        setError("No data returned after employee creation.");
        return;
      }

      setSuccess(`Employee ${id ? "updated" : "created"} successfully.`);
      setTimeout(() => navigate("/employees"), 1500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
        {id ? "Edit Employee" : "New Employee"}
      </h2>

      {formData.profile_pic_url && (
        <div className="mb-4">
          <Avatar
            name={formData.full_name}
            src={formData.profile_pic_url}
            size="100"
            round
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Full Name</Label>
          <Input name="full_name" value={formData.full_name} onChange={handleChange} required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <Label>Department</Label>
          <Input name="department" value={formData.department} onChange={handleChange} />
        </div>
        <div>
          <Label>Position</Label>
          <Input name="position" value={formData.position} onChange={handleChange} />
        </div>
        <div>
          <Label>Employee ID</Label>
          <Input name="employee_id" value={formData.employee_id} onChange={handleChange} required />
        </div>
        <div>
          <Label>Reporting Manager</Label>
          <Input name="reporting_manager" value={formData.reporting_manager} onChange={handleChange} />
        </div>
        <div>
          <Label>Role</Label>
          <Input name="role" value={formData.role} onChange={handleChange} />
        </div>
        <div>
          <Label>Scopes</Label>
          <Textarea name="scopes" value={formData.scopes} onChange={handleChange} />
        </div>
        <div>
          <Label>Responsibilities</Label>
          <Textarea name="responsibilities" value={formData.responsibilities} onChange={handleChange} />
        </div>
        <div>
          <Label>Profile Picture URL</Label>
          <Input
            name="profile_pic_url"
            value={formData.profile_pic_url}
            onChange={handleChange}
            placeholder="Paste image URL"
          />
        </div>

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <Button type="submit" className="mt-4">
          {id ? "Update" : "Create"}
        </Button>
      </form>
    </div>
  );
}


