class BFScript {
  get_time() {
    return current_time;
  }

  get_string_value(key: string): string {
    const obj = mod?.stringkeys;
    return obj?.[key];
  }
}
