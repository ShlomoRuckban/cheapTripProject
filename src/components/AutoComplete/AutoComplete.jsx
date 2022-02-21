import "./AutoComplete.css"
import {useState} from "react"
export default function AutoComplete({
  value,
  setValue,
  placeholder,
  onChange,
  options,
  setOptions
}) {
  const [optionsActive,setOptionsActive] = useState(false);
  return (
    <div className="autoComplete">
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onClick={!optionsActive && setOptionsActive(true)}
        onBlur={()=>{
          setTimeout(()=>{
            setOptions([])
          },200);
        }}
      />
      <ul>
        {options && options.map(option =><li onClick={()=>{
          setValue(option);
          setOptions([]);
        }}>{option}</li>)}
      </ul>
    </div>
  );
}
