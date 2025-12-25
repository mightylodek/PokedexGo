"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleSimulationRequestDto = exports.UpdatePokemonInstanceDto = exports.CreatePokemonInstanceDto = exports.LoginDto = exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "displayName", void 0);
class LoginDto {
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class CreatePokemonInstanceDto {
}
exports.CreatePokemonInstanceDto = CreatePokemonInstanceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePokemonInstanceDto.prototype, "formId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePokemonInstanceDto.prototype, "nickname", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(2),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreatePokemonInstanceDto.prototype, "levelTimes2", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], CreatePokemonInstanceDto.prototype, "ivAtk", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], CreatePokemonInstanceDto.prototype, "ivDef", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], CreatePokemonInstanceDto.prototype, "ivSta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePokemonInstanceDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePokemonInstanceDto.prototype, "favorite", void 0);
class UpdatePokemonInstanceDto {
}
exports.UpdatePokemonInstanceDto = UpdatePokemonInstanceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePokemonInstanceDto.prototype, "nickname", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(2),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdatePokemonInstanceDto.prototype, "levelTimes2", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], UpdatePokemonInstanceDto.prototype, "ivAtk", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], UpdatePokemonInstanceDto.prototype, "ivDef", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], UpdatePokemonInstanceDto.prototype, "ivSta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePokemonInstanceDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePokemonInstanceDto.prototype, "favorite", void 0);
class BattleSimulationRequestDto {
}
exports.BattleSimulationRequestDto = BattleSimulationRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BattleSimulationRequestDto.prototype, "participant1FormId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BattleSimulationRequestDto.prototype, "participant2FormId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], BattleSimulationRequestDto.prototype, "participant1Level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], BattleSimulationRequestDto.prototype, "participant2Level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], BattleSimulationRequestDto.prototype, "participant1IvAtk", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], BattleSimulationRequestDto.prototype, "participant1IvDef", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], BattleSimulationRequestDto.prototype, "participant1IvSta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], BattleSimulationRequestDto.prototype, "participant2IvAtk", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], BattleSimulationRequestDto.prototype, "participant2IvDef", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(15),
    __metadata("design:type", Number)
], BattleSimulationRequestDto.prototype, "participant2IvSta", void 0);
//# sourceMappingURL=dto.js.map