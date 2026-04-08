import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DatePickerField, TimePickerField, UNKNOWN_TIME } from "../components/BirthPickerField";
import PageIntro from "../components/PageIntro";
import PageSection from "../components/PageSection";
import IconBadge from "../components/IconBadge";
import { preferenceOptions } from "../data/site";
import { usePageView } from "../services/analytics";
import { saveLatestProfile } from "../services/reportApi";

const initialForm = {
  name: "",
  gender: "",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  preferences: []
};

function Label({ icon, children }) {
  return (
    <label className="block">
      <span className="mb-3 flex items-center gap-3 text-base font-semibold text-white">
        <IconBadge icon={icon} className="h-9 w-9 rounded-xl" />
        {children}
      </span>
    </label>
  );
}

function validateForm(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "请输入姓名";
  }

  if (!form.gender) {
    errors.gender = "请选择性别";
  }

  if (!form.birthDate) {
    errors.birthDate = "请选择出生日期";
  }

  if (!form.birthTime) {
    errors.birthTime = "请选择出生时间";
  }

  if (!form.birthPlace.trim()) {
    errors.birthPlace = "请输入出生地点";
  }

  if (form.birthDate) {
    const now = new Date();
    const todayValue = [
      now.getFullYear(),
      `${now.getMonth() + 1}`.padStart(2, "0"),
      `${now.getDate()}`.padStart(2, "0")
    ].join("-");

    if (form.birthDate > todayValue) {
      errors.birthDate = "出生日期不能晚于今天";
    } else if (form.birthDate === todayValue && form.birthTime && form.birthTime !== UNKNOWN_TIME) {
      const [hour, minute] = form.birthTime.split(":").map(Number);
      const candidate = new Date(now);
      candidate.setHours(hour || 0, minute || 0, 0, 0);

      if (candidate.getTime() > now.getTime()) {
        errors.birthTime = "出生日期时间不能晚于当前时间";
      }
    }
  }

  return errors;
}

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-3 text-sm text-rose-300">{message}</p>;
}

export default function InfoFormPage() {
  usePageView("measure");

  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const fieldRefs = useRef({});

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const togglePreference = (preference) => {
    setForm((current) => {
      const exists = current.preferences.includes(preference);

      return {
        ...current,
        preferences: exists
          ? current.preferences.filter((item) => item !== preference)
          : [...current.preferences, preference]
      };
    });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstErrorKey = Object.keys(nextErrors)[0];
      fieldRefs.current[firstErrorKey]?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      return;
    }

    saveLatestProfile(form);
    navigate("/result", { state: { profile: form } });
  };

  return (
    <div className="pb-6">
      <PageIntro title="填写您的信息" subtitle="请准确填写以下信息，我们将为您生成专属的命理解读" />

      <PageSection className="pt-12">
        <form className="panel mx-auto max-w-3xl p-6 sm:p-8 lg:p-10" onSubmit={onSubmit} noValidate>
          <div className="space-y-7">
            <div ref={(node) => { fieldRefs.current.name = node; }}>
              <Label icon="user">姓名</Label>
              <input
                className={`input-shell ${errors.name ? "border-rose-300/60 shadow-[0_0_0_4px_rgba(251,113,133,0.08)]" : ""}`}
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="请输入您的姓名"
              />
              <FieldError message={errors.name} />
            </div>

            <div ref={(node) => { fieldRefs.current.gender = node; }}>
              <Label icon="user">性别</Label>
              <div className="grid grid-cols-2 gap-4">
                {["男", "女"].map((gender) => {
                  const active = form.gender === gender;
                  return (
                    <button
                      key={gender}
                      type="button"
                      className={`rounded-2xl border px-5 py-4 text-base font-semibold transition duration-200 ${
                        active
                          ? "border-gold-300/45 bg-gold-400/12 text-gold-300 shadow-[0_0_0_3px_rgba(230,195,90,0.08)]"
                          : `border-gold-500/18 bg-white/5 text-mist-200 hover:border-gold-300/35 hover:bg-white/10 ${
                              errors.gender ? "border-rose-300/45" : ""
                            }`
                      }`}
                      onClick={() => updateField("gender", gender)}
                    >
                      {gender}
                    </button>
                  );
                })}
              </div>
              <FieldError message={errors.gender} />
            </div>

            <div ref={(node) => { fieldRefs.current.birthDate = node; }}>
              <Label icon="calendar">出生日期</Label>
              <DatePickerField value={form.birthDate} onChange={(birthDate) => updateField("birthDate", birthDate)} />
              <FieldError message={errors.birthDate} />
            </div>

            <div ref={(node) => { fieldRefs.current.birthTime = node; }}>
              <Label icon="clock">出生时间</Label>
              <TimePickerField
                value={form.birthTime}
                onChange={(birthTime) => updateField("birthTime", birthTime)}
                selectedDate={form.birthDate}
                helperText="时辰对命理解读至关重要，请尽量准确填写。"
              />
              <FieldError message={errors.birthTime} />
            </div>

            <div ref={(node) => { fieldRefs.current.birthPlace = node; }}>
              <Label icon="pin">出生地点</Label>
              <input
                className={`input-shell ${errors.birthPlace ? "border-rose-300/60 shadow-[0_0_0_4px_rgba(251,113,133,0.08)]" : ""}`}
                value={form.birthPlace}
                onChange={(event) => updateField("birthPlace", event.target.value)}
                placeholder="例如：北京市朝阳区"
              />
              <FieldError message={errors.birthPlace} />
            </div>

            <div>
              <Label icon="star">测算偏好</Label>
              <div className="flex flex-wrap gap-3">
                {preferenceOptions.map((item) => {
                  const active = form.preferences.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`rounded-full border px-5 py-3 text-sm font-semibold transition duration-200 ${
                        active
                          ? "border-gold-300/45 bg-gold-400/12 text-gold-300"
                          : "border-gold-500/18 bg-white/5 text-mist-200 hover:border-gold-300/35 hover:bg-white/10"
                      }`}
                      onClick={() => togglePreference(item)}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-10 w-full rounded-full border border-gold-300/40 bg-gold-400 px-6 py-4 text-base font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98]"
          >
            生成命理解读
          </button>

          <p className="mt-5 text-center text-sm text-mist-400">我们承诺保护您的隐私安全</p>
        </form>
      </PageSection>

      <PageSection className="pt-8 pb-12">
        <div className="panel mx-auto max-w-3xl px-6 py-5 text-sm leading-7 text-mist-300 sm:px-8">
          <span className="font-semibold text-gold-300">温馨提示：</span>
          出生时间越准确，命理解读越精准。如不确定具体时辰，可以咨询长辈或查询出生证明。
        </div>
      </PageSection>
    </div>
  );
}
