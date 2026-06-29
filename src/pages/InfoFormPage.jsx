import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DatePickerField,
  TimePickerField,
  UNKNOWN_TIME,
  parseBirthTimeValue
} from "../components/BirthPickerField";
import PageIntro from "../components/PageIntro";
import PageSection from "../components/PageSection";
import IconBadge from "../components/IconBadge";
import { preferenceOptions } from "../data/site";
import { trackEvent, usePageView } from "../services/analytics";
import { saveLatestProfile } from "../services/reportApi";

const reportBenefits = [
  { label: "先看简版共鸣", text: "快速了解性格底色、关注主题与近期提醒。" },
  { label: "再看完整报告", text: "继续展开事业、财运、关系与阶段行动建议。" },
  { label: "不确定也能测", text: "出生时间可选择暂不清楚，报告会用更稳妥的方式表达。" }
];

const privacyNotes = ["仅用于生成本次解读", "不会在报告中展示敏感地址", "可随时重新填写"];

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
      const parsedTime = parseBirthTimeValue(form.birthTime);
      const hour = Number(parsedTime.hour);
      const minute = Number(parsedTime.minute);
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
  const formStartedRef = useRef(false);

  const trackFormStart = (formStep) => {
    if (formStartedRef.current) {
      return;
    }

    formStartedRef.current = true;
    trackEvent("measure_form_start", { form_step: formStep });
  };

  const updateField = (key, value) => {
    trackFormStart(key);

    if (key === "gender" && value) {
      trackEvent("measure_gender_selected", { form_step: "gender" });
    }

    if (key === "birthDate" && value) {
      trackEvent("measure_birth_date_filled", {
        form_step: "birthDate",
        has_birth_date: true
      });
    }

    if (key === "birthTime" && value) {
      trackEvent("measure_birth_time_filled", {
        form_step: "birthTime",
        has_birth_time: true
      });
    }

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
    trackFormStart("preferences");
    setForm((current) => {
      const exists = current.preferences.includes(preference);

      if (!exists) {
        trackEvent("measure_focus_selected", {
          form_step: "preferences",
          focus_type: preference
        });
      }

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
    trackEvent("measure_submit_click", {
      form_step: "submit",
      has_birth_date: Boolean(form.birthDate),
      has_birth_time: Boolean(form.birthTime)
    });

    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstErrorKey = Object.keys(nextErrors)[0];
      trackEvent("measure_submit_error", {
        form_step: firstErrorKey,
        error_type: firstErrorKey,
        has_birth_date: Boolean(form.birthDate),
        has_birth_time: Boolean(form.birthTime)
      });
      fieldRefs.current[firstErrorKey]?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      return;
    }

    trackEvent("measure_submit_success", {
      form_step: "submit",
      focus_count: form.preferences.length,
      has_birth_date: true,
      has_birth_time: Boolean(form.birthTime)
    });
    saveLatestProfile(form);
    navigate("/result", { state: { profile: form } });
  };

  return (
    <div className="pb-6">
      <PageIntro title="生成你的阶段解读" subtitle="填写基础出生信息，先获得简版共鸣，再继续查看完整报告" />

      <PageSection className="pt-10">
        <div className="panel mx-auto max-w-3xl px-6 py-6 sm:px-8">
          <div className="grid gap-5 sm:grid-cols-3">
            {reportBenefits.map((item) => (
              <div key={item.label}>
                <p className="text-sm font-semibold text-gold-300">{item.label}</p>
                <p className="mt-2 text-xs leading-6 text-mist-300">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {privacyNotes.map((item) => (
              <span
                key={item}
                className="rounded-full border border-gold-400/16 bg-white/5 px-3 py-1.5 text-xs font-semibold text-mist-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </PageSection>

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
                helperText="可按传统时辰选择，也可精确到分钟；如果不确定，也可以先选择暂不清楚。"
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
            生成我的简版解读
          </button>

          <p className="mt-5 text-center text-sm leading-6 text-mist-400">
            通常 20-40 秒生成结果。信息仅用于本次解读，命语不会把你的出生信息展示给他人。
          </p>
        </form>
      </PageSection>

      <PageSection className="pt-8 pb-12">
        <div className="panel mx-auto max-w-3xl px-6 py-5 text-sm leading-7 text-mist-300 sm:px-8">
          <span className="font-semibold text-gold-300">温馨提示：</span>
          出生时间越准确，命理解读越细致；如果暂时不确定，也可以先选择“暂不清楚”完成体验。
        </div>
      </PageSection>
    </div>
  );
}
